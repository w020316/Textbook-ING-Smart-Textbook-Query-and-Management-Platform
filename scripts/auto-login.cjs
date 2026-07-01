/**
 * Puppeteer 自动化登录脚本
 * 利用用户已有的 GitHub 会话，自动登录 Vercel 和 Neon
 * 获取部署所需的 Token 和 API Key
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EDGE_PROFILE = 'C:\\Users\\86181\\AppData\\Local\\Microsoft\\Edge\\User Data';
const TEMP_PROFILE = 'D:\\dev-tools\\edge-puppeteer-profile';

function log(msg) {
  console.log(`[Puppeteer] ${msg}`);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function ensureTempProfile() {
  // 创建临时 profile 目录
  if (!fs.existsSync(TEMP_PROFILE)) {
    fs.mkdirSync(TEMP_PROFILE, { recursive: true });
  }

  // 复制 Default profile 的关键文件（Cookies, Local State）
  const defaultProfile = path.join(EDGE_PROFILE, 'Default');
  const filesToCopy = ['Cookies', 'Local State'];

  // 先复制 Local State（在 User Data 根目录）
  const localStateSrc = path.join(EDGE_PROFILE, 'Local State');
  const localStateDst = path.join(TEMP_PROFILE, 'Local State');
  if (fs.existsSync(localStateSrc)) {
    try {
      fs.copyFileSync(localStateSrc, localStateDst);
      log('已复制 Local State');
    } catch (e) {
      log(`复制 Local State 失败: ${e.message}`);
    }
  }

  // 复制 Default profile 的 Cookies
  const tempDefault = path.join(TEMP_PROFILE, 'Default');
  if (!fs.existsSync(tempDefault)) {
    fs.mkdirSync(tempDefault, { recursive: true });
  }

  const cookiesSrc = path.join(defaultProfile, 'Cookies');
  const cookiesDst = path.join(tempDefault, 'Cookies');
  if (fs.existsSync(cookiesSrc)) {
    try {
      fs.copyFileSync(cookiesSrc, cookiesDst);
      log('已复制 Cookies');
    } catch (e) {
      log(`复制 Cookies 失败: ${e.message}`);
    }
  }

  // 复制 Network 目录中的 Cookies
  const networkDir = path.join(EDGE_PROFILE, 'Default', 'Network');
  const tempNetworkDir = path.join(TEMP_PROFILE, 'Default', 'Network');
  if (fs.existsSync(networkDir)) {
    if (!fs.existsSync(tempNetworkDir)) {
      fs.mkdirSync(tempNetworkDir, { recursive: true });
    }
    const networkCookies = path.join(networkDir, 'Cookies');
    if (fs.existsSync(networkCookies)) {
      try {
        fs.copyFileSync(networkCookies, path.join(tempNetworkDir, 'Cookies'));
        log('已复制 Network Cookies');
      } catch (e) {
        log(`复制 Network Cookies 失败: ${e.message}`);
      }
    }
  }
}

async function launchBrowser() {
  log('启动 Edge 浏览器...');

  // 尝试使用用户原始 profile
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      userDataDir: EDGE_PROFILE,
      headless: false,
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-popup-blocking',
        '--start-maximized',
      ],
    });
    log('使用原始 Edge Profile 启动成功');
    return browser;
  } catch (e) {
    log(`使用原始 Profile 启动失败: ${e.message}`);
    log('尝试使用临时 Profile（复制 Cookie）...');

    await ensureTempProfile();

    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      userDataDir: TEMP_PROFILE,
      headless: false,
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-popup-blocking',
        '--start-maximized',
      ],
    });
    log('使用临时 Profile 启动成功');
    return browser;
  }
}

async function getVercelToken(browser) {
  log('========== 获取 Vercel Token ==========');

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 步骤 1: 访问 Vercel Token 创建页面
  log('访问 Vercel Token 页面...');
  await page.goto('https://vercel.com/account/tokens', { waitUntil: 'networkidle2', timeout: 30000 });

  await sleep(2000);
  const currentUrl = page.url();
  log(`当前 URL: ${currentUrl}`);

  // 检查是否需要登录
  if (currentUrl.includes('login') || currentUrl.includes('signup')) {
    log('需要登录 Vercel，尝试使用 GitHub 登录...');

    // 查找并点击 "Continue with GitHub" 按钮
    try {
      const githubBtn = await page.evaluateHandle(() => {
        const elements = document.querySelectorAll('a, button');
        for (const el of elements) {
          if (el.textContent.includes('GitHub') || el.textContent.includes('github')) {
            return el;
          }
        }
        return null;
      });

      if (githubBtn && (await githubBtn.evaluate(el => el !== null))) {
        await githubBtn.click();
        log('已点击 GitHub 登录按钮');
        await sleep(5000);

        // 如果 GitHub 已登录，会自动重定向回 Vercel
        // 如果需要授权，会显示授权页面
        const authUrl = page.url();
        log(`GitHub 授权 URL: ${authUrl}`);

        if (authUrl.includes('github.com')) {
          // 查找授权按钮
          try {
            await page.waitForSelector('button[name="authorize"], input[name="authorize"]', { timeout: 10000 });
            await page.click('button[name="authorize"], input[name="authorize"]');
            log('已点击 GitHub 授权按钮');
            await sleep(5000);
          } catch {
            log('可能已自动授权或需要手动操作');
            await sleep(5000);
          }
        }
      } else {
        log('未找到 GitHub 登录按钮，尝试其他登录方式...');
      }
    } catch (e) {
      log(`GitHub 登录异常: ${e.message}`);
    }

    // 等待重定向回 Vercel
    await sleep(3000);
    log(`登录后 URL: ${page.url()}`);

    // 再次访问 Token 页面
    await page.goto('https://vercel.com/account/tokens', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
  }

  // 步骤 2: 创建 Token
  log('在 Token 创建页面...');
  const tokenPageUrl = page.url();
  log(`Token 页面 URL: ${tokenPageUrl}`);

  if (tokenPageUrl.includes('tokens')) {
    try {
      // 填写 Token 名称
      await page.waitForSelector('input[name="name"], input[placeholder*="name"], input[type="text"]', { timeout: 10000 });
      await page.type('input[name="name"], input[placeholder*="name"], input[type="text"]', 'textbook-ing-deploy');

      // 选择 scope - 尝试选择 Full Account
      try {
        const scopeSelect = await page.$('select[name="scope"]');
        if (scopeSelect) {
          await scopeSelect.select('full');
        }
      } catch {}

      // 选择 expiration - 尝试选择较长时间
      try {
        const expirySelect = await page.$('select[name="expiration"]');
        if (expirySelect) {
          await expirySelect.select('86400'); // 24 hours or whatever option
        }
      } catch {}

      // 点击创建按钮
      const createBtn = await page.evaluateHandle(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent.includes('Create') || btn.textContent.includes('创建')) {
            return btn;
          }
        }
        return null;
      });

      if (createBtn && (await createBtn.evaluate(el => el !== null))) {
        await createBtn.click();
        log('已点击创建 Token 按钮');
        await sleep(3000);

        // 提取 Token 值
        const token = await page.evaluate(() => {
          // 查找显示 token 的元素
          const tokenInput = document.querySelector('input[readonly], input[type="text"][value*=""]');
          if (tokenInput && tokenInput.value) {
            return tokenInput.value;
          }
          // 查找包含 token 格式文本的元素
          const elements = document.querySelectorAll('code, pre, span, div, input');
          for (const el of elements) {
            const text = el.textContent || el.value || '';
            if (text.match(/^[a-zA-Z0-9_\-]{20,}$/)) {
              return text.trim();
            }
          }
          return null;
        });

        if (token) {
          log(`Vercel Token 获取成功: ${token.slice(0, 10)}...`);
          return token;
        } else {
          log('未能自动提取 Token，尝试从页面内容查找...');
          const content = await page.content();
          const tokenMatch = content.match(/[a-zA-Z0-9_\-]{40,}/);
          if (tokenMatch) {
            log(`从页面内容提取到 Token: ${tokenMatch[0].slice(0, 10)}...`);
            return tokenMatch[0];
          }
        }
      }
    } catch (e) {
      log(`创建 Token 失败: ${e.message}`);
    }
  }

  log('Vercel Token 自动获取失败');
  return null;
}

async function getNeonApiKey(browser) {
  log('========== 获取 Neon API Key ==========');

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 步骤 1: 访问 Neon API Keys 页面
  log('访问 Neon API Keys 页面...');
  await page.goto('https://console.neon.tech/app/settings/api-keys', { waitUntil: 'networkidle2', timeout: 30000 });

  await sleep(2000);
  let currentUrl = page.url();
  log(`当前 URL: ${currentUrl}`);

  // 检查是否需要登录
  if (currentUrl.includes('login') || currentUrl.includes('signup') || currentUrl.includes('auth')) {
    log('需要登录 Neon，尝试使用 GitHub 登录...');

    try {
      // 查找 GitHub 登录按钮
      const githubBtn = await page.evaluateHandle(() => {
        const elements = document.querySelectorAll('a, button');
        for (const el of elements) {
          if (el.textContent.includes('GitHub') || el.textContent.includes('github')) {
            return el;
          }
        }
        return null;
      });

      if (githubBtn && (await githubBtn.evaluate(el => el !== null))) {
        await githubBtn.click();
        log('已点击 GitHub 登录按钮');
        await sleep(5000);

        // 处理 GitHub 授权
        const authUrl = page.url();
        log(`GitHub 授权 URL: ${authUrl}`);

        if (authUrl.includes('github.com')) {
          try {
            await page.waitForSelector('button[name="authorize"], input[name="authorize"]', { timeout: 10000 });
            await page.click('button[name="authorize"], input[name="authorize"]');
            log('已点击 GitHub 授权按钮');
            await sleep(5000);
          } catch {
            log('可能已自动授权或需要手动操作');
            await sleep(5000);
          }
        }
      } else {
        log('未找到 GitHub 登录按钮');
      }
    } catch (e) {
      log(`GitHub 登录异常: ${e.message}`);
    }

    // 等待重定向回 Neon
    await sleep(3000);

    // 可能需要处理 Neon 的注册流程
    currentUrl = page.url();
    log(`登录后 URL: ${currentUrl}`);

    if (currentUrl.includes('signup') || currentUrl.includes('register')) {
      log('需要完成 Neon 注册...');
      // 等待用户完成注册（如果有表单）
      try {
        // 查找并点击 "Create account" 或 "Sign up with GitHub" 按钮
        const signupBtn = await page.evaluateHandle(() => {
          const elements = document.querySelectorAll('a, button');
          for (const el of elements) {
            const text = el.textContent.toLowerCase();
            if (text.includes('create') || text.includes('sign up') || text.includes('register')) {
              return el;
            }
          }
          return null;
        });

        if (signupBtn && (await signupBtn.evaluate(el => el !== null))) {
          await signupBtn.click();
          await sleep(5000);
        }
      } catch {}
    }

    // 访问 API Keys 页面
    await page.goto('https://console.neon.tech/app/settings/api-keys', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
  }

  // 步骤 2: 创建 API Key
  log('在 API Keys 页面...');
  try {
    // 查找创建按钮
    const createBtn = await page.evaluateHandle(() => {
      const buttons = document.querySelectorAll('button, a');
      for (const btn of buttons) {
        if (btn.textContent.includes('Create') || btn.textContent.includes('New') || btn.textContent.includes('创建')) {
          return btn;
        }
      }
      return null;
    });

    if (createBtn && (await createBtn.evaluate(el => el !== null))) {
      await createBtn.click();
      log('已点击创建 API Key 按钮');
      await sleep(2000);

      // 填写名称
      try {
        await page.waitForSelector('input[name="name"], input[type="text"]', { timeout: 5000 });
        await page.type('input[name="name"], input[type="text"]', 'textbook-ing-deploy');
      } catch {}

      // 确认创建
      try {
        const confirmBtn = await page.evaluateHandle(() => {
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            if (btn.textContent.includes('Create') || btn.textContent.includes('Confirm') || btn.textContent.includes('创建')) {
              return btn;
            }
          }
          return null;
        });

        if (confirmBtn && (await confirmBtn.evaluate(el => el !== null))) {
          await confirmBtn.click();
          log('已确认创建');
          await sleep(3000);
        }
      } catch {}

      // 提取 API Key
      const apiKey = await page.evaluate(() => {
        const elements = document.querySelectorAll('code, pre, span, div, input, p');
        for (const el of elements) {
          const text = el.textContent || el.value || '';
          // Neon API keys usually start with "neon_" or are long hex strings
          if (text.match(/^neon_[a-zA-Z0-9]+$/) || text.match(/^[a-f0-9]{40,}$/)) {
            return text.trim();
          }
        }
        return null;
      });

      if (apiKey) {
        log(`Neon API Key 获取成功: ${apiKey.slice(0, 15)}...`);
        return apiKey;
      }
    }
  } catch (e) {
    log(`创建 API Key 失败: ${e.message}`);
  }

  log('Neon API Key 自动获取失败');
  return null;
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  自动登录并获取部署凭据                       ║');
  console.log('║  Vercel Token + Neon API Key                  ║');
  console.log('╚══════════════════════════════════════════════╝');

  const browser = await launchBrowser();

  const results = {};

  try {
    // 获取 Vercel Token
    results.vercelToken = await getVercelToken(browser);

    // 获取 Neon API Key
    results.neonApiKey = await getNeonApiKey(browser);

  } catch (e) {
    log(`异常: ${e.message}`);
  } finally {
    // 输出结果
    console.log('\n========================================');
    console.log('获取结果:');
    console.log('========================================');
    console.log(`Vercel Token: ${results.vercelToken || '未获取'}`);
    console.log(`Neon API Key: ${results.neonApiKey || '未获取'}`);

    // 保存到文件
    if (results.vercelToken || results.neonApiKey) {
      const credPath = path.join(process.cwd(), '.deploy-creds.json');
      fs.writeFileSync(credPath, JSON.stringify(results, null, 2), 'utf8');
      log(`凭据已保存到: ${credPath}`);
    }

    // 关闭浏览器
    log('关闭浏览器...');
    await browser.close();
  }

  return results;
}

main().catch(err => {
  console.error('[Puppeteer ERROR]', err.message);
  process.exit(1);
});
