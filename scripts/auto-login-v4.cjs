/**
 * v4: 使用 page.type() 正确填写 React 表单
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const log = (msg) => console.log(`[v4] ${msg}`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  log('连接 Edge...');
  const resp = await fetch('http://localhost:9222/json/version');
  const version = await resp.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: version.webSocketDebuggerUrl });
  log('已连接');

  const results = {};

  // ==================== Vercel Token ====================
  log('\n===== Vercel Token =====');
  const vpage = await browser.newPage();
  try {
    await vpage.goto('https://vercel.com/account/settings/tokens', { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(4000);
    log(`URL: ${vpage.url()}`);

    // 查找 Token 名称输入框并使用 page.type() 填写
    const nameInput = await vpage.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        // 检查是否在 token 创建表单中
        const parent = input.closest('form, [class*="form"], [class*="token"], [class*="create"]');
        if (parent || !input.value) {
          // 给输入框添加唯一 ID 用于 page.type()
          input.id = 'vercel-token-name-input';
          return true;
        }
      }
      return false;
    });

    if (nameInput) {
      // 使用 page.type() 模拟真实键盘输入
      await vpage.click('#vercel-token-name-input');
      await vpage.evaluate(() => {
        document.getElementById('vercel-token-name-input').value = '';
      });
      await vpage.type('#vercel-token-name-input', 'textbook-ing-deploy');
      log('已用键盘输入填写名称');
      await sleep(500);
    } else {
      log('未找到名称输入框，尝试所有 input...');
      const inputInfo = await vpage.evaluate(() => {
        return Array.from(document.querySelectorAll('input')).map(i => ({
          type: i.type,
          name: i.name,
          id: i.id,
          placeholder: i.placeholder,
          value: i.value,
          className: i.className.slice(0, 50),
        }));
      });
      log(`Inputs: ${JSON.stringify(inputInfo)}`);
    }

    // 选择 scope - 查找 select 元素
    const scopeSelected = await vpage.evaluate(() => {
      const selects = document.querySelectorAll('select');
      for (const sel of selects) {
        // 查找 scope select
        const options = Array.from(sel.options).map(o => o.text);
        if (options.some(o => o.includes('Full') || o.includes('全部'))) {
          sel.id = 'vercel-scope-select';
          return { id: 'vercel-scope-select', options };
        }
      }
      return null;
    });

    if (scopeSelected) {
      // 使用 native setter 选择
      await vpage.evaluate(() => {
        const sel = document.getElementById('vercel-scope-select');
        for (const opt of sel.options) {
          if (opt.text.includes('Full') || opt.text.includes('全部')) {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
            nativeSetter.call(sel, opt.value);
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      });
      log('已选择 scope');
    }

    // 选择 expiration - 无过期
    await vpage.evaluate(() => {
      const selects = document.querySelectorAll('select');
      for (const sel of selects) {
        if (sel.id === 'vercel-scope-select') continue;
        for (const opt of sel.options) {
          if (opt.text.includes('无过期') || opt.text.includes('Never') || opt.text.includes('No expiration')) {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
            nativeSetter.call(sel, opt.value);
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      }
    });
    log('已选择 expiration');
    await sleep(500);

    // 点击创作按钮
    const clicked = await vpage.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent.trim();
        if (text === '创作' || text === 'Create') {
          btn.click();
          return text;
        }
      }
      return null;
    });

    if (clicked) {
      log(`已点击: "${clicked}"`);
      await sleep(5000);

      // 检查是否有验证错误
      const errors = await vpage.evaluate(() => {
        const errorElements = document.querySelectorAll('[class*="error"], [class*="invalid"], [class*="Error"]');
        return Array.from(errorElements).map(e => e.textContent.trim()).filter(t => t.length > 0).slice(0, 5);
      });

      if (errors.length > 0) {
        log(`表单错误: ${JSON.stringify(errors)}`);
      }

      // 提取 Token
      const token = await vpage.evaluate(() => {
        // 检查是否有成功提示
        const text = document.body.innerText;

        // 查找 token 值
        const inputs = document.querySelectorAll('input');
        for (const input of inputs) {
          if (input.value && input.value.length > 25 && input.value.match(/^[a-zA-Z0-9_\-]+$/)) {
            return input.value;
          }
        }

        // 查找 code/pre
        const codes = document.querySelectorAll('code, pre, [class*="token-value"], [class*="copy"]');
        for (const code of codes) {
          const t = (code.textContent || '').trim();
          if (t.length > 25 && t.match(/^[a-zA-Z0-9_\-]+$/)) {
            return t;
          }
        }

        // 从文本中查找
        const lines = text.split('\n');
        for (const line of lines) {
          const t = line.trim();
          if (t.length > 30 && t.match(/^[a-zA-Z0-9_\-]+$/) && !t.includes('textbook')) {
            return t;
          }
        }

        return null;
      });

      if (token) {
        log(`✓ Vercel Token: ${token.slice(0, 15)}...`);
        results.vercelToken = token;
      } else {
        log('Token 未找到，查看页面内容:');
        const text = await vpage.evaluate(() => document.body.innerText.slice(0, 2000));
        log(text);
      }
    } else {
      log('未找到创作按钮');
    }
  } catch (e) {
    log(`Vercel 异常: ${e.message}`);
  }
  await vpage.close();

  // ==================== Neon API Key ====================
  log('\n===== Neon API Key =====');
  const npage = await browser.newPage();
  try {
    await npage.goto('https://console.neon.tech/app/settings#api-keys', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);

    // 点击创建
    const createClicked = await npage.evaluate(() => {
      const btns = document.querySelectorAll('button, a, div[role="button"]');
      for (const btn of btns) {
        if (btn.textContent.includes('创建') && btn.textContent.includes('API')) {
          btn.click();
          return true;
        }
      }
      const allBtns = document.querySelectorAll('button');
      for (const btn of allBtns) {
        if (btn.textContent.trim().includes('创建') && btn.textContent.length < 40) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (createClicked) {
      log('已点击创建');
      await sleep(2000);

      // 使用 page.type() 填写名称
      const inputReady = await npage.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
        for (const input of inputs) {
          if (!input.value) {
            input.id = 'neon-key-name';
            return true;
          }
        }
        return false;
      });

      if (inputReady) {
        await npage.click('#neon-key-name');
        await npage.type('#neon-key-name', 'textbook-ing');
        log('已填写名称');
      }
      await sleep(500);

      // 点击创作
      const confirmed = await npage.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent.trim();
          if (text === '创作' || text === 'Create' || text === '创建') {
            btn.click();
            return text;
          }
        }
        return null;
      });

      if (confirmed) {
        log(`已点击: "${confirmed}"`);
        await sleep(3000);

        // 提取 API Key
        const apiKey = await npage.evaluate(() => {
          const text = document.body.innerText;

          // 1. neon_ 格式
          const neonMatch = text.match(/neon_[a-zA-Z0-9]{20,}/g);
          if (neonMatch) return neonMatch[0];

          // 2. input
          const inputs = document.querySelectorAll('input');
          for (const input of inputs) {
            if (input.value && input.value.length > 30) {
              return input.value.trim();
            }
          }

          // 3. code/pre
          const codes = document.querySelectorAll('code, pre, [class*="key"], [class*="secret"]');
          for (const code of codes) {
            const t = (code.textContent || '').trim();
            if (t.length > 20 && t.length < 200 && t.match(/^[a-zA-Z0-9_\-]+$/)) {
              return t;
            }
          }

          // 4. 所有文本
          const lines = text.split('\n');
          for (const line of lines) {
            const t = line.trim();
            if (t.length > 30 && t.length < 200 && t.match(/^[a-f0-9]+$/i)) {
              return t;
            }
          }

          return null;
        });

        if (apiKey) {
          log(`✓ Neon API Key: ${apiKey.slice(0, 20)}...`);
          results.neonApiKey = apiKey;
        } else {
          log('API Key 未找到，页面内容:');
          const text = await npage.evaluate(() => document.body.innerText.slice(0, 2000));
          log(text);
        }
      }
    }
  } catch (e) {
    log(`Neon 异常: ${e.message}`);
  }
  await npage.close();

  // ==================== 结果 ====================
  console.log('\n========================================');
  console.log('最终结果:');
  console.log('========================================');
  console.log(`Vercel Token: ${results.vercelToken || '未获取'}`);
  console.log(`Neon API Key: ${results.neonApiKey || '未获取'}`);

  if (results.vercelToken || results.neonApiKey) {
    fs.writeFileSync('.deploy-creds.json', JSON.stringify(results, null, 2), 'utf8');
    log('凭据已保存到 .deploy-creds.json');
  }

  browser.disconnect();
  return results;
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
