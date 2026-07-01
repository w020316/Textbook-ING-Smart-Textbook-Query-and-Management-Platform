/**
 * 快速获取凭据 - 修正按钮文本"创作"
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const log = (msg) => console.log(`[Fast] ${msg}`);
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
    await vpage.goto('https://vercel.com/account/settings/tokens', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);
    log(`URL: ${vpage.url()}`);

    // 填写 Token 名称
    await vpage.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
      for (const input of inputs) {
        if (!input.value || input.value.length < 5) {
          input.focus();
          input.value = 'textbook-ing-deploy';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    });
    log('已填写名称');

    // 选择 Full Account scope
    await vpage.evaluate(() => {
      const selects = document.querySelectorAll('select');
      for (const sel of selects) {
        for (const opt of sel.options) {
          if (opt.text.includes('Full') || opt.text.includes('全部') || opt.value.includes('full')) {
            sel.value = opt.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      }
    });

    // 选择无过期
    await vpage.evaluate(() => {
      const selects = document.querySelectorAll('select');
      for (const sel of selects) {
        for (const opt of sel.options) {
          if (opt.text.includes('无过期') || opt.text.includes('No expiration') || opt.text.includes('Never')) {
            sel.value = opt.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      }
    });
    log('已选择 scope 和 expiration');
    await sleep(500);

    // 点击 "创作" 按钮
    const clicked = await vpage.evaluate(() => {
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

    if (clicked) {
      log(`已点击按钮: "${clicked}"`);
      await sleep(4000);

      // 提取 Token
      const token = await vpage.evaluate(() => {
        // 方法1: input 元素
        const inputs = document.querySelectorAll('input');
        for (const input of inputs) {
          if (input.value && input.value.length > 20) {
            const v = input.value.trim();
            if (v.match(/^[a-zA-Z0-9_\-]+$/) && !v.includes('textbook')) {
              return v;
            }
          }
        }
        // 方法2: code/pre
        const codes = document.querySelectorAll('code, pre, [class*="token-value"], [class*="copy"]');
        for (const code of codes) {
          const t = (code.textContent || '').trim();
          if (t.length > 20 && t.match(/^[a-zA-Z0-9_\-]+$/)) {
            return t;
          }
        }
        // 方法3: 页面文本
        const text = document.body.innerText;
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
        log('未能提取 Token，打印页面内容:');
        const text = await vpage.evaluate(() => document.body.innerText.slice(0, 1500));
        log(text);
      }
    } else {
      log('未找到创作按钮');
      const btns = await vpage.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.length < 20);
      });
      log(`页面按钮: ${JSON.stringify(btns)}`);
    }
  } catch (e) {
    log(`Vercel 异常: ${e.message}`);
  }
  await vpage.close();

  // ==================== Neon API Key ====================
  log('\n===== Neon API Key =====');
  const npage = await browser.newPage();
  try {
    await npage.goto('https://console.neon.tech/app/settings#api-keys', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    log(`URL: ${npage.url()}`);

    // 点击 "创建新的API密钥"
    const createClicked = await npage.evaluate(() => {
      const elements = document.querySelectorAll('button, a, div[role="button"]');
      for (const el of elements) {
        const text = el.textContent.trim();
        if (text.includes('创建') && text.includes('API') || text === '创建新的API密钥') {
          el.click();
          return true;
        }
      }
      // 退而求其次，找任何包含"创建"的按钮
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.includes('创建') && btn.textContent.length < 30) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (createClicked) {
      log('已点击创建按钮');
      await sleep(2000);

      // 填写名称
      await npage.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
        for (const input of inputs) {
          if (!input.value) {
            input.focus();
            input.value = 'textbook-ing';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      });
      log('已填写名称');
      await sleep(500);

      // 点击 "创作" 按钮
      const confirmed = await npage.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent.trim();
          if (text === '创作' || text === 'Create' || text === '创建' || text === '确认') {
            btn.click();
            return text;
          }
        }
        return null;
      });

      if (confirmed) {
        log(`已点击确认: "${confirmed}"`);
        await sleep(3000);

        // 提取 API Key
        const apiKey = await npage.evaluate(() => {
          // 1. 查找 neon_ 开头
          const text = document.body.innerText;
          const neonMatch = text.match(/neon_[a-zA-Z0-9]{20,}/g);
          if (neonMatch) return neonMatch[0];

          // 2. 查找 input
          const inputs = document.querySelectorAll('input');
          for (const input of inputs) {
            if (input.value && input.value.length > 30) {
              return input.value.trim();
            }
          }

          // 3. 查找 code/pre
          const codes = document.querySelectorAll('code, pre, [class*="key"], [class*="secret"]');
          for (const code of codes) {
            const t = (code.textContent || '').trim();
            if (t.length > 20 && t.length < 200 && t.match(/^[a-zA-Z0-9_\-]+$/)) {
              return t;
            }
          }

          // 4. 从文本中查找长字符串
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
          log('未能提取 API Key，打印页面内容:');
          const text = await npage.evaluate(() => document.body.innerText.slice(0, 1500));
          log(text);
        }
      } else {
        log('未找到确认按钮');
        const btns = await npage.evaluate(() => {
          return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.length < 20);
        });
        log(`对话框按钮: ${JSON.stringify(btns)}`);
      }
    } else {
      log('未找到创建按钮');
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
