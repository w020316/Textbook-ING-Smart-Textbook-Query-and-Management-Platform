/**
 * 改进版：连接 Edge 远程调试，获取 Vercel Token 和 Neon API Key
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const log = (msg) => console.log(`[Auto2] ${msg}`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  改进版：自动获取部署凭据                     ║');
  console.log('╚══════════════════════════════════════════════╝');

  // 获取 WebSocket URL
  log('获取 Edge 调试信息...');
  const resp = await fetch('http://localhost:9222/json/version');
  const version = await resp.json();
  const wsEndpoint = version.webSocketDebuggerUrl;
  log(`WebSocket: ${wsEndpoint}`);

  const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
  log('已连接 Edge');

  const results = {};

  // ==================== Neon API Key ====================
  log('\n===== 获取 Neon API Key =====');
  results.neonApiKey = await getNeonApiKey(browser);

  // ==================== Vercel Token ====================
  log('\n===== 获取 Vercel Token =====');
  results.vercelToken = await getVercelToken(browser);

  // 输出结果
  console.log('\n========================================');
  console.log('获取结果:');
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

// ==================== Neon ====================
async function getNeonApiKey(browser) {
  const page = await browser.newPage();

  try {
    log('访问 Neon 设置页...');
    await page.goto('https://console.neon.tech/app/settings', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);

    // 点击 API Keys 标签
    log('查找 API Keys 标签...');
    const clicked = await page.evaluate(() => {
      const elements = document.querySelectorAll('a, button, div, span, li');
      for (const el of elements) {
        const text = el.textContent || '';
        if (text.includes('API') && text.includes('密钥') || text.includes('API Keys') || text.includes('API keys')) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) log('已点击 API Keys 标签');
    await sleep(2000);

    // 直接导航到 API keys 部分
    await page.goto('https://console.neon.tech/app/settings#api-keys', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);

    // 查找并点击 "创建新的API密钥" 按钮
    log('查找创建 API Key 按钮...');
    const createClicked = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, div[role="button"], span');
      for (const el of elements) {
        const text = el.textContent || '';
        if ((text.includes('创建') && text.includes('API')) || text.includes('Create') && text.includes('API') || text.includes('创建新的API密钥')) {
          el.click();
          return true;
        }
      }
      // 尝试找所有按钮
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.includes('创建') || btn.textContent.includes('Create') || btn.textContent.includes('New')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (createClicked) {
      log('已点击创建按钮，等待对话框...');
      await sleep(2000);

      // 截图调试
      const html = await page.content();
      log(`对话框 HTML 长度: ${html.length}`);

      // 在对话框中填写名称
      await page.evaluate(() => {
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
      await sleep(500);

      // 查找并点击确认按钮
      log('查找确认按钮...');
      const confirmed = await page.evaluate(() => {
        // 查找对话框中的创建/确认按钮
        const dialogs = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="dialog"], [class*="Modal"]');
        const searchIn = dialogs.length > 0 ? dialogs : [document.body];

        for (const container of searchIn) {
          const buttons = container.querySelectorAll('button');
          for (const btn of buttons) {
            const text = btn.textContent || '';
            if (text.includes('创建') && text.length < 20 || text.includes('Create') && text.length < 20 || text.includes('确认') || text.includes('Confirm') || text.includes('Save')) {
              btn.click();
              return text;
            }
          }
        }
        return null;
      });

      if (confirmed) {
        log(`已点击确认按钮: "${confirmed}"`);
        await sleep(3000);

        // 提取 API Key - 更全面地搜索
        const apiKey = await page.evaluate(() => {
          // 1. 查找所有文本内容
          const allText = document.body.innerText;

          // 2. 查找 neon_ 开头的字符串
          const neonMatch = allText.match(/neon_[a-zA-Z0-9]{20,}/g);
          if (neonMatch && neonMatch.length > 0) return neonMatch[0];

          // 3. 查找长字符串（可能是 API key）
          const lines = allText.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            // Neon API keys 通常是 40+ 字符的 hex 或 base64
            if (trimmed.match(/^[a-f0-9]{40,}$/i) || trimmed.match(/^[a-zA-Z0-9_\-]{40,}$/)) {
              if (!trimmed.includes('http') && !trimmed.includes('html')) {
                return trimmed;
              }
            }
          }

          // 4. 查找 input 元素
          const inputs = document.querySelectorAll('input');
          for (const input of inputs) {
            if (input.value && input.value.length > 30) {
              return input.value;
            }
          }

          // 5. 查找 code/pre 元素
          const codes = document.querySelectorAll('code, pre, [class*="key"], [class*="token"], [class*="secret"]');
          for (const code of codes) {
            const text = code.textContent || '';
            if (text.length > 30 && text.length < 200) {
              const trimmed = text.trim();
              if (trimmed.match(/^[a-zA-Z0-9_\-]+$/)) {
                return trimmed;
              }
            }
          }

          return null;
        });

        if (apiKey) {
          log(`API Key 提取成功: ${apiKey.slice(0, 20)}...`);
          return apiKey;
        } else {
          log('未能自动提取 API Key');
          // 打印页面上所有可能包含 key 的文本
          const possibleKeys = await page.evaluate(() => {
            const results = [];
            const elements = document.querySelectorAll('code, pre, input, [class*="key"], [class*="token"], [class*="copy"], [class*="secret"]');
            for (const el of elements) {
              const text = (el.textContent || el.value || '').trim();
              if (text && text.length > 20 && text.length < 200) {
                results.push({ tag: el.tagName, text: text.slice(0, 100) });
              }
            }
            // 也检查所有包含长字符串的文本节点
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let node;
            while (node = walker.nextNode()) {
              const text = node.textContent.trim();
              if (text.length > 30 && text.length < 200 && text.match(/^[a-zA-Z0-9_\-\/+]+$/)) {
                results.push({ tag: 'TEXT', text: text.slice(0, 100) });
              }
            }
            return results.slice(0, 10);
          });
          log(`可能的 key 元素: ${JSON.stringify(possibleKeys)}`);

          // 打印对话框内容
          const dialogText = await page.evaluate(() => {
            const dialogs = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="dialog"]');
            let text = '';
            for (const d of dialogs) {
              text += d.innerText + '\n---\n';
            }
            return text || document.body.innerText.slice(0, 1000);
          });
          log(`对话框内容: ${dialogText.slice(0, 500)}`);
        }
      } else {
        log('未找到确认按钮');
        const dialogText = await page.evaluate(() => {
          const dialogs = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="Modal"]');
          let text = '';
          for (const d of dialogs) text += d.innerText + '\n';
          return text;
        });
        log(`对话框内容: ${dialogText.slice(0, 500)}`);
      }
    } else {
      log('未找到创建按钮');
      // 检查是否已有 API keys
      const existingKeys = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.slice(0, 1000);
      });
      log(`页面内容: ${existingKeys.slice(0, 500)}`);
    }
  } catch (e) {
    log(`Neon 异常: ${e.message}`);
  } finally {
    await page.close();
  }
  return null;
}

// ==================== Vercel ====================
async function getVercelToken(browser) {
  const page = await browser.newPage();

  try {
    log('访问 Vercel 首页...');
    await page.goto('https://vercel.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);
    log(`首页 URL: ${page.url()}`);

    // 检查是否已登录
    const isLoggedIn = await page.evaluate(() => {
      return !window.location.href.includes('login') && !window.location.href.includes('signup');
    });

    if (!isLoggedIn) {
      log('需要登录 Vercel，访问登录页...');
      await page.goto('https://vercel.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(3000);
      log(`登录页 URL: ${page.url()}`);

      // 点击 GitHub 登录
      const githubClicked = await page.evaluate(() => {
        const elements = document.querySelectorAll('a, button, div[role="button"]');
        for (const el of elements) {
          if (el.textContent.includes('GitHub') || el.textContent.includes('github')) {
            el.click();
            return true;
          }
        }
        return false;
      });

      if (githubClicked) {
        log('已点击 GitHub 登录');
        await sleep(8000); // 等待 GitHub OAuth
        log(`OAuth 后 URL: ${page.url()}`);

        // 处理 GitHub 授权
        if (page.url().includes('github.com')) {
          try {
            await page.waitForSelector('button[name="authorize"], button#js-oauth-authorize-btn, input[name="authorize"]', { timeout: 10000 });
            await page.click('button[name="authorize"], button#js-oauth-authorize-btn, input[name="authorize"]');
            log('已点击 GitHub 授权');
            await sleep(8000);
          } catch {
            log('GitHub 可能已自动授权');
            await sleep(5000);
          }
        }

        // 处理 Vercel 新用户注册
        log(`当前 URL: ${page.url()}`);
        if (page.url().includes('signup') || page.url().includes('new')) {
          log('处理 Vercel 注册流程...');
          await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
              if (btn.textContent.includes('Continue') || btn.textContent.includes('Create') || btn.textContent.includes('Sign up')) {
                btn.click();
                return;
              }
            }
          });
          await sleep(5000);
        }
      }
    } else {
      log('已登录 Vercel');
    }

    // 访问 Token 页面
    log('访问 Token 创建页面...');
    await page.goto('https://vercel.com/account/tokens', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);
    log(`Token 页面 URL: ${page.url()}`);

    // 如果被重定向到登录页
    if (page.url().includes('login')) {
      log('仍需登录，Vercel Token 获取失败');
      return null;
    }

    // 查找创建 Token 表单或按钮
    log('查找 Token 创建表单...');

    // 先尝试直接填写表单（如果页面上有表单）
    const hasInput = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
      return inputs.length > 0;
    });

    if (!hasInput) {
      // 查找 "Create Token" 按钮
      const clicked = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, a, div[role="button"]');
        for (const btn of buttons) {
          const text = btn.textContent || '';
          if (text.includes('Create') && text.length < 30) {
            btn.click();
            return true;
          }
        }
        return false;
      });
      if (clicked) {
        log('已点击 Create Token 按钮');
        await sleep(2000);
      }
    }

    // 填写 Token 名称
    await page.evaluate(() => {
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
    log('已填写 Token 名称');

    // 选择 Scope 和 Expiration
    await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      for (const sel of selects) {
        // 选择 Full Account scope 或最长过期时间
        for (const opt of sel.options) {
          if (opt.text.includes('Full') || opt.text.includes('全部') || opt.value.includes('full')) {
            sel.value = opt.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      }
    });

    await sleep(500);

    // 点击创建按钮
    const created = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent || '';
        if ((text.includes('Create') && text.length < 30) || text.includes('创建')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (created) {
      log('已点击创建 Token 按钮');
      await sleep(4000);

      // 提取 Token
      const token = await page.evaluate(() => {
        // 查找 input 中的 token
        const inputs = document.querySelectorAll('input');
        for (const input of inputs) {
          if (input.value && input.value.length > 20 && input.value.match(/^[a-zA-Z0-9_\-]+$/)) {
            return input.value;
          }
        }

        // 查找页面文本中的 token
        const text = document.body.innerText;
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.match(/^[a-zA-Z0-9_\-]{30,}$/)) {
            return trimmed;
          }
        }

        // 查找 code/pre
        const codes = document.querySelectorAll('code, pre, [class*="token"]');
        for (const code of codes) {
          const text = (code.textContent || '').trim();
          if (text.length > 20 && text.match(/^[a-zA-Z0-9_\-]+$/)) {
            return text;
          }
        }

        return null;
      });

      if (token) {
        log(`Vercel Token 获取成功: ${token.slice(0, 15)}...`);
        return token;
      } else {
        log('未能提取 Token');
        const pageText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
        log(`页面内容: ${pageText.slice(0, 500)}`);
      }
    } else {
      log('未找到创建按钮');
      const pageText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
      log(`页面内容: ${pageText.slice(0, 500)}`);
    }
  } catch (e) {
    log(`Vercel 异常: ${e.message}`);
  } finally {
    await page.close();
  }
  return null;
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
