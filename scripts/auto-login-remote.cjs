/**
 * 通过远程调试连接 Edge 浏览器，自动登录 Vercel 和 Neon
 * 利用用户已有的 GitHub 会话
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

function log(msg) {
  console.log(`[Auto] ${msg}`);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  通过远程调试连接 Edge，自动获取部署凭据      ║');
  console.log('╚══════════════════════════════════════════════╝');

  // 连接到运行中的 Edge
  log('连接到 Edge 远程调试...');
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://localhost:9222/devtools/browser/1238f4aa-fd28-421d-a893-d112f197bbe6',
  });
  log('连接成功！');

  const results = {};

  // ==================== Vercel ====================
  log('\n========== 获取 Vercel Token ==========');
  try {
    results.vercelToken = await getVercelToken(browser);
  } catch (e) {
    log(`Vercel 异常: ${e.message}`);
  }

  // ==================== Neon ====================
  log('\n========== 获取 Neon API Key ==========');
  try {
    results.neonApiKey = await getNeonApiKey(browser);
  } catch (e) {
    log(`Neon 异常: ${e.message}`);
  }

  // 输出结果
  console.log('\n========================================');
  console.log('获取结果:');
  console.log('========================================');
  console.log(`Vercel Token: ${results.vercelToken || '未获取'}`);
  console.log(`Neon API Key: ${results.neonApiKey || '未获取'}`);

  // 保存凭据
  if (results.vercelToken || results.neonApiKey) {
    const credPath = path.join(process.cwd(), '.deploy-creds.json');
    fs.writeFileSync(credPath, JSON.stringify(results, null, 2), 'utf8');
    log(`凭据已保存到: ${credPath}`);
  }

  // 断开连接（不关闭浏览器）
  browser.disconnect();
  log('已断开 Puppeteer 连接（浏览器保持打开）');

  return results;
}

async function getVercelToken(browser) {
  const page = await browser.newPage();

  // 访问 Vercel Token 页面
  log('访问 Vercel Token 页面...');
  await page.goto('https://vercel.com/account/tokens', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);

  let url = page.url();
  log(`当前 URL: ${url}`);

  // 检查是否需要登录
  if (url.includes('login') || url.includes('signup') || url.includes('sso')) {
    log('需要登录 Vercel...');
    await handleVercelLogin(page);
    await sleep(2000);
    url = page.url();
    log(`登录后 URL: ${url}`);

    // 再次访问 Token 页面
    if (!url.includes('tokens')) {
      await page.goto('https://vercel.com/account/tokens', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
    }
  }

  // 检查是否是新用户（需要注册）
  url = page.url();
  if (url.includes('signup') || url.includes('new') || url.includes('onboarding')) {
    log('检测到注册/引导页面，尝试完成...');
    await handleVercelSignup(page);
    await sleep(2000);
    await page.goto('https://vercel.com/account/tokens', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
  }

  // 创建 Token
  log('在 Token 页面创建 Token...');
  return await createVercelToken(page);
}

async function handleVercelLogin(page) {
  try {
    // 查找 GitHub 登录按钮
    const githubBtn = await page.evaluate(() => {
      const elements = document.querySelectorAll('a, button, div[role="button"]');
      for (const el of elements) {
        const text = el.textContent || '';
        if (text.includes('GitHub') || text.includes('github')) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (githubBtn) {
      log('已点击 GitHub 登录按钮');
      await sleep(5000);

      // 检查是否在 GitHub 授权页面
      const url = page.url();
      log(`GitHub 页面 URL: ${url}`);

      if (url.includes('github.com')) {
        // 如果已登录 GitHub，可能需要点击授权
        try {
          await page.waitForSelector('button[name="authorize"], input[name="authorize"], button#js-oauth-authorize-btn', { timeout: 10000 });
          await page.click('button[name="authorize"], input[name="authorize"], button#js-oauth-authorize-btn');
          log('已点击 GitHub 授权按钮');
          await sleep(5000);
        } catch {
          log('GitHub 可能已自动授权，或需要登录');
          await sleep(3000);
        }
      }
    } else {
      log('未找到 GitHub 按钮，尝试其他登录方式');
    }
  } catch (e) {
    log(`登录处理异常: ${e.message}`);
  }
}

async function handleVercelSignup(page) {
  try {
    // 查找继续/创建按钮
    const btn = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, div[role="button"]');
      for (const el of elements) {
        const text = el.textContent || '';
        if (text.includes('Continue') || text.includes('Create') || text.includes('Sign up') || text.includes('Import')) {
          el.click();
          return true;
        }
      }
      return false;
    });
    if (btn) {
      log('已点击注册/继续按钮');
      await sleep(3000);
    }
  } catch (e) {
    log(`注册处理异常: ${e.message}`);
  }
}

async function createVercelToken(page) {
  try {
    // 等待页面加载
    await sleep(2000);
    const url = page.url();
    log(`Token 创建页面 URL: ${url}`);

    if (!url.includes('vercel.com')) {
      log('不在 Vercel 页面，跳过');
      return null;
    }

    // 截图用于调试
    // await page.screenshot({ path: 'vercel-tokens-page.png' });

    // 查找创建 Token 的表单
    // Vercel 的 Token 页面通常有一个表单或按钮
    const hasForm = await page.evaluate(() => {
      // 查找 Token 名称输入框
      const inputs = document.querySelectorAll('input');
      let foundNameInput = false;
      for (const input of inputs) {
        if (input.type === 'text' || input.name === 'name' || input.placeholder?.includes('name') || input.placeholder?.includes('Token')) {
          foundNameInput = true;
          break;
        }
      }
      return foundNameInput;
    });

    if (hasForm) {
      log('找到 Token 创建表单');
      // 填写 Token 名称
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        for (const input of inputs) {
          if (input.type === 'text' || input.name === 'name' || input.placeholder?.includes('name') || input.placeholder?.includes('Token')) {
            input.value = 'textbook-ing-deploy';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      });

      // 选择 Scope (Full Account)
      try {
        await page.evaluate(() => {
          const selects = document.querySelectorAll('select');
          for (const sel of selects) {
            for (const opt of sel.options) {
              if (opt.value.includes('full') || opt.text.includes('Full') || opt.text.includes('全部')) {
                sel.value = opt.value;
                sel.dispatchEvent(new Event('change', { bubbles: true }));
                break;
              }
            }
          }
        });
      } catch {}

      // 选择 Expiration (最长)
      try {
        await page.evaluate(() => {
          const selects = document.querySelectorAll('select');
          for (const sel of selects) {
            if (sel.name === 'expiration' || sel.id.includes('expiration')) {
              // 选择最后一个选项（通常是最长时间）
              if (sel.options.length > 0) {
                sel.value = sel.options[sel.options.length - 1].value;
                sel.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
          }
        });
      } catch {}

      await sleep(500);

      // 点击创建按钮
      const created = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent || '';
          if (text.includes('Create') || text.includes('创建')) {
            btn.click();
            return true;
          }
        }
        return false;
      });

      if (created) {
        log('已点击创建 Token 按钮');
        await sleep(3000);

        // 提取 Token
        const token = await page.evaluate(() => {
          // 方法1: 查找显示 token 的输入框
          const inputs = document.querySelectorAll('input');
          for (const input of inputs) {
            if (input.value && input.value.match(/^[a-zA-Z0-9_\-]{20,}$/)) {
              return input.value;
            }
          }
          // 方法2: 查找 code/pre 元素
          const codes = document.querySelectorAll('code, pre, [class*="token"], [class*="copy"]');
          for (const code of codes) {
            const text = code.textContent || '';
            if (text.match(/^[a-zA-Z0-9_\-]{20,}$/)) {
              return text.trim();
            }
          }
          // 方法3: 从页面内容中查找
          const body = document.body.innerText;
          const matches = body.match(/[a-zA-Z0-9_\-]{40,}/g);
          if (matches) {
            // 过滤掉明显不是 token 的（如 hash、url 等）
            for (const m of matches) {
              if (!m.includes('http') && !m.includes('html') && m.length >= 30) {
                return m;
              }
            }
          }
          return null;
        });

        if (token) {
          log(`Token 获取成功: ${token.slice(0, 12)}...`);
          return token;
        } else {
          log('未能从页面提取 Token');
          // 打印页面内容用于调试
          const text = await page.evaluate(() => document.body.innerText);
          log(`页面内容（前500字符）: ${text.slice(0, 500)}`);
        }
      }
    } else {
      log('未找到 Token 创建表单');
      // 可能需要先点击一个 "Create Token" 按钮
      const clicked = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, a, div[role="button"]');
        for (const btn of buttons) {
          const text = btn.textContent || '';
          if (text.includes('Create') || text.includes('Generate') || text.includes('New') || text.includes('创建')) {
            btn.click();
            return true;
          }
        }
        return false;
      });

      if (clicked) {
        log('已点击创建按钮，等待表单...');
        await sleep(2000);
        return await createVercelToken(page); // 递归尝试
      }

      const text = await page.evaluate(() => document.body.innerText);
      log(`页面内容（前500字符）: ${text.slice(0, 500)}`);
    }
  } catch (e) {
    log(`创建 Token 异常: ${e.message}`);
  }
  return null;
}

async function getNeonApiKey(browser) {
  const page = await browser.newPage();

  log('访问 Neon API Keys 页面...');
  await page.goto('https://console.neon.tech/app/settings/api-keys', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);

  let url = page.url();
  log(`当前 URL: ${url}`);

  // 检查是否需要登录
  if (url.includes('login') || url.includes('signup') || url.includes('auth')) {
    log('需要登录 Neon...');
    await handleNeonLogin(page);
    await sleep(2000);
    url = page.url();
    log(`登录后 URL: ${url}`);

    // 处理注册流程
    if (url.includes('signup') || url.includes('register') || url.includes('onboarding')) {
      log('检测到注册页面...');
      await handleNeonSignup(page);
      await sleep(3000);
    }

    // 再次访问 API Keys 页面
    await page.goto('https://console.neon.tech/app/settings/api-keys', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
  }

  // 创建 API Key
  log('在 API Keys 页面创建...');
  return await createNeonApiKey(page);
}

async function handleNeonLogin(page) {
  try {
    const clicked = await page.evaluate(() => {
      const elements = document.querySelectorAll('a, button, div[role="button"]');
      for (const el of elements) {
        const text = el.textContent || '';
        if (text.includes('GitHub') || text.includes('github')) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      log('已点击 GitHub 登录');
      await sleep(5000);

      const url = page.url();
      if (url.includes('github.com')) {
        try {
          await page.waitForSelector('button[name="authorize"], input[name="authorize"], button#js-oauth-authorize-btn', { timeout: 10000 });
          await page.click('button[name="authorize"], input[name="authorize"], button#js-oauth-authorize-btn');
          log('已点击 GitHub 授权');
          await sleep(5000);
        } catch {
          log('GitHub 可能已自动授权');
          await sleep(3000);
        }
      }
    }
  } catch (e) {
    log(`Neon 登录异常: ${e.message}`);
  }
}

async function handleNeonSignup(page) {
  try {
    // Neon 注册可能需要确认一些信息
    const clicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, div[role="button"]');
      for (const btn of buttons) {
        const text = btn.textContent || '';
        if (text.includes('Create') || text.includes('Sign up') || text.includes('Continue') || text.includes('Get started')) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    if (clicked) {
      log('已点击注册按钮');
      await sleep(3000);
    }
  } catch (e) {
    log(`Neon 注册异常: ${e.message}`);
  }
}

async function createNeonApiKey(page) {
  try {
    await sleep(2000);
    const url = page.url();
    log(`Neon API Keys 页面 URL: ${url}`);

    if (!url.includes('neon.tech')) {
      log('不在 Neon 页面，跳过');
      return null;
    }

    // 查找创建按钮
    const clicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, div[role="button"]');
      for (const btn of buttons) {
        const text = btn.textContent || '';
        if (text.includes('Create') || text.includes('New') || text.includes('Generate') || text.includes('创建')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      log('已点击创建 API Key');
      await sleep(2000);

      // 填写名称
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input[name="name"]');
        for (const input of inputs) {
          input.value = 'textbook-ing';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      // 确认创建
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent || '';
          if (text.includes('Create') || text.includes('Confirm') || text.includes('Save') || text.includes('创建')) {
            btn.click();
            return;
          }
        }
      });
      log('已确认创建');
      await sleep(3000);

      // 提取 API Key
      const apiKey = await page.evaluate(() => {
        // Neon API keys 可能以特定格式出现
        const allText = document.body.innerText;
        const matches = allText.match(/neon_[a-zA-Z0-9]+/g);
        if (matches && matches.length > 0) {
          return matches[0];
        }
        // 尝试其他格式
        const elements = document.querySelectorAll('code, pre, input, span, div, p');
        for (const el of elements) {
          const text = el.textContent || el.value || '';
          if (text.match(/^neon_/) || text.match(/^[a-f0-9]{40,}$/)) {
            return text.trim();
          }
        }
        return null;
      });

      if (apiKey) {
        log(`Neon API Key 获取成功: ${apiKey.slice(0, 20)}...`);
        return apiKey;
      } else {
        log('未能提取 API Key');
        const text = await page.evaluate(() => document.body.innerText);
        log(`页面内容（前500字符）: ${text.slice(0, 500)}`);
      }
    } else {
      log('未找到创建按钮');
      const text = await page.evaluate(() => document.body.innerText);
      log(`页面内容（前500字符）: ${text.slice(0, 500)}`);
    }
  } catch (e) {
    log(`创建 API Key 异常: ${e.message}`);
  }
  return null;
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
