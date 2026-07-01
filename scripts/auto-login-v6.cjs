/**
 * v6: 修正 API 参数后再次尝试
 * - Vercel: POST /v3/user/tokens 不接受 scope 字段
 * - Neon: POST /api/v2/api_keys 需要 key_name 字段
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const log = (msg) => console.log(`[v6] ${msg}`);
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
    log(`Vercel URL: ${vpage.url()}`);

    // 先尝试多种 body 格式
    const tokenResult = await vpage.evaluate(async () => {
      const attempts = [
        // 不带 scope
        { endpoint: '/v3/user/tokens', body: { name: 'textbook-ing-deploy' } },
        // 带 type
        { endpoint: '/v3/user/tokens', body: { name: 'textbook-ing-deploy', type: 'oauth2' } },
        // 带 expiration (永不过期 = null)
        { endpoint: '/v3/user/tokens', body: { name: 'textbook-ing-deploy', expiration: null } },
        // 经典端点
        { endpoint: '/api/tokens', body: { name: 'textbook-ing-deploy' } },
        { endpoint: '/api/user/tokens', body: { name: 'textbook-ing-deploy' } },
      ];

      const tried = [];
      for (const a of attempts) {
        try {
          const url = `https://api.vercel.com${a.endpoint}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(a.body),
          });
          const text = await res.text();
          let data;
          try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
          tried.push({ endpoint: a.endpoint, body: a.body, status: res.status, data });
          if (res.ok) {
            return { success: true, endpoint: a.endpoint, data, tried };
          }
        } catch (e) {
          tried.push({ endpoint: a.endpoint, body: a.body, error: e.message });
        }
      }
      return { success: false, tried };
    });

    log(`Vercel 尝试结果: ${JSON.stringify(tokenResult).slice(0, 800)}`);

    if (tokenResult.success && tokenResult.data) {
      const data = tokenResult.data;
      // Vercel token 通常在 data.token 或 data.bearerToken 或 jwt 之类字段
      const token = data.token || data.bearerToken || data.accessToken ||
                    data.value || (typeof data === 'string' ? data : null);
      if (token) {
        log(`✓ Vercel Token: ${String(token).slice(0, 20)}...`);
        results.vercelToken = String(token);
      } else {
        log(`API 返回数据: ${JSON.stringify(data).slice(0, 800)}`);
        // 兜底正则提取
        const dataStr = JSON.stringify(data);
        // Vercel token 格式：通常以特定前缀开头
        const m = dataStr.match(/"(token|bearerToken|accessToken|jwt)"\s*:\s*"([^"]{20,})"/i);
        if (m) {
          log(`从字段提取到: ${m[1]}=${m[2].slice(0, 20)}...`);
          results.vercelToken = m[2];
        }
      }
    }
  } catch (e) {
    log(`Vercel 异常: ${e.message}`);
  }
  await vpage.close();

  // ==================== Neon API Key ====================
  log('\n===== Neon API Key =====');
  const npage = await browser.newPage();
  try {
    await npage.goto('https://console.neon.tech/app/settings', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    log(`Neon URL: ${npage.url()}`);

    const keyResult = await npage.evaluate(async () => {
      const attempts = [
        // 用 key_name 字段
        { endpoint: 'https://console.neon.tech/api/v2/api_keys', body: { key_name: 'textbook-ing' } },
        // 同时带 name
        { endpoint: 'https://console.neon.tech/api/v2/api_keys', body: { key_name: 'textbook-ing', name: 'textbook-ing' } },
      ];

      const tried = [];
      for (const a of attempts) {
        try {
          const res = await fetch(a.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(a.body),
          });
          const text = await res.text();
          let data;
          try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
          tried.push({ status: res.status, data });
          if (res.ok) {
            return { success: true, data, tried };
          }
        } catch (e) {
          tried.push({ error: e.message });
        }
      }
      return { success: false, tried };
    });

    log(`Neon 尝试结果: ${JSON.stringify(keyResult).slice(0, 800)}`);

    if (keyResult.success && keyResult.data) {
      const data = keyResult.data;
      // Neon 返回的 key 通常在 data.key 或 data.api_key
      const apiKey = data.key || data.api_key || data.token || data.id ||
                     (typeof data === 'string' ? data : null);
      if (apiKey) {
        log(`✓ Neon API Key: ${String(apiKey).slice(0, 25)}...`);
        results.neonApiKey = String(apiKey);
      } else {
        log(`API 返回: ${JSON.stringify(data).slice(0, 500)}`);
        const dataStr = JSON.stringify(data);
        const m = dataStr.match(/"(key|api_key|token)"\s*:\s*"([^"]{20,})"/i);
        if (m) {
          log(`从字段提取: ${m[1]}=${m[2].slice(0, 25)}...`);
          results.neonApiKey = m[2];
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
