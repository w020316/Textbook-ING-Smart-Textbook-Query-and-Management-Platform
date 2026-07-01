/**
 * v7: 从 Vercel 网站的 cookie 中提取认证 token
 * 然后用该 token 调用 api.vercel.com 创建正式的部署 token
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const log = (msg) => console.log(`[v7] ${msg}`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  log('连接 Edge...');
  const resp = await fetch('http://localhost:9222/json/version');
  const version = await resp.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: version.webSocketDebuggerUrl });
  log('已连接');

  const page = await browser.newPage();
  try {
    await page.goto('https://vercel.com/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);
    log(`URL: ${page.url()}`);

    // 1. 读取所有 cookie
    const cookies = await page.cookies();
    log(`共 ${cookies.length} 个 cookie`);
    
    // 找认证相关 cookie
    const authCookies = cookies.filter(c => 
      /auth|token|jwt|session|bearer/i.test(c.name)
    );
    log('\n认证相关 cookie:');
    authCookies.forEach(c => {
      log(`  ${c.name} (domain=${c.domain}): ${String(c.value).slice(0, 40)}${c.value.length > 40 ? '...' : ''}`);
    });

    // 2. 从 localStorage / sessionStorage 找 token
    const storage = await page.evaluate(() => {
      const result = { localStorage: {}, sessionStorage: {} };
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = localStorage.getItem(k);
        if (/auth|token|jwt|bearer/i.test(k) || (v && v.length > 20 && v.length < 500)) {
          result.localStorage[k] = v ? v.slice(0, 100) : null;
        }
      }
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        const v = sessionStorage.getItem(k);
        if (/auth|token|jwt|bearer/i.test(k)) {
          result.sessionStorage[k] = v ? v.slice(0, 100) : null;
        }
      }
      return result;
    });
    log('\nStorage 中的认证数据:');
    log(`  localStorage: ${JSON.stringify(storage.localStorage).slice(0, 500)}`);
    log(`  sessionStorage: ${JSON.stringify(storage.sessionStorage).slice(0, 500)}`);

    // 3. 尝试从 Vercel 同域 API 获取/创建 token
    log('\n尝试同域 API:');
    const result = await page.evaluate(async () => {
      // Vercel 网站通常在 nextjs 端有 /api 路由
      const endpoints = [
        { url: '/api/v3/user/tokens', method: 'POST', body: { name: 'textbook-ing-deploy' } },
        { url: '/api/v2/user/tokens', method: 'POST', body: { name: 'textbook-ing-deploy' } },
        { url: '/api/user/tokens', method: 'POST', body: { name: 'textbook-ing-deploy' } },
        { url: '/api/tokens', method: 'POST', body: { name: 'textbook-ing-deploy' } },
        // GET 当前用户信息（验证 cookie 是否有效）
        { url: '/api/v2/user', method: 'GET' },
        { url: '/api/user', method: 'GET' },
      ];

      const tried = [];
      for (const ep of endpoints) {
        try {
          const opts = { method: ep.method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
          if (ep.body && ep.method !== 'GET') {
            opts.body = JSON.stringify(ep.body);
          }
          const res = await fetch(ep.url, opts);
          const text = await res.text();
          let data;
          try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 200) }; }
          tried.push({ ep: ep.url, method: ep.method, status: res.status, data: JSON.stringify(data).slice(0, 300) });
          if (res.ok && ep.method === 'POST') {
            return { success: true, endpoint: ep.url, data, tried };
          }
        } catch (e) {
          tried.push({ ep: ep.url, method: ep.method, error: e.message });
        }
      }
      return { success: false, tried };
    });
    log(`同域 API 结果: ${JSON.stringify(result).slice(0, 800)}`);

    // 4. 如果同域 fetch 也带不上认证，则尝试把 cookie 直接给 api.vercel.com
    if (!result.success) {
      log('\n尝试用同域 cookie 调 api.vercel.com:');
      // 拼接 cookie header
      const vercelCookies = cookies.filter(c => c.domain.includes('vercel.com'));
      const cookieHeader = vercelCookies.map(c => `${c.name}=${c.value}`).join('; ');
      
      // 在 Node 端直接调用
      const apiResult = await (async () => {
        const endpoints = [
          '/v3/user/tokens',
          '/v2/user/tokens',
        ];
        for (const ep of endpoints) {
          try {
            const res = await fetch(`https://api.vercel.com${ep}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader,
                'Origin': 'https://vercel.com',
                'Referer': 'https://vercel.com/account/settings/tokens',
              },
              body: JSON.stringify({ name: 'textbook-ing-deploy' }),
            });
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 200) }; }
            log(`  api.vercel.com${ep}: ${res.status} - ${JSON.stringify(data).slice(0, 300)}`);
            if (res.ok) return { success: true, endpoint: ep, data };
          } catch (e) {
            log(`  api.vercel.com${ep} 异常: ${e.message}`);
          }
        }
        return { success: false };
      })();
      
      if (apiResult.success) {
        const data = apiResult.data;
        const token = data.token || data.bearerToken || data.accessToken || data.value;
        if (token) {
          log(`✓ Vercel Token: ${String(token).slice(0, 20)}...`);
          // 读取已有凭据并合并
          let existing = {};
          try { existing = JSON.parse(fs.readFileSync('.deploy-creds.json', 'utf8')); } catch {}
          existing.vercelToken = String(token);
          fs.writeFileSync('.deploy-creds.json', JSON.stringify(existing, null, 2), 'utf8');
          log('已更新 .deploy-creds.json');
          browser.disconnect();
          return existing;
        }
      }
    } else if (result.data) {
      const data = result.data;
      const token = data.token || data.bearerToken || data.accessToken || data.value;
      if (token) {
        log(`✓ Vercel Token: ${String(token).slice(0, 20)}...`);
        let existing = {};
        try { existing = JSON.parse(fs.readFileSync('.deploy-creds.json', 'utf8')); } catch {}
        existing.vercelToken = String(token);
        fs.writeFileSync('.deploy-creds.json', JSON.stringify(existing, null, 2), 'utf8');
        log('已更新 .deploy-creds.json');
        browser.disconnect();
        return existing;
      }
    }
  } catch (e) {
    log(`异常: ${e.message}`);
  }
  await page.close();
  browser.disconnect();
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
