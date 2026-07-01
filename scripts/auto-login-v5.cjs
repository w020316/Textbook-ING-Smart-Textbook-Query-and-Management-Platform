/**
 * v5: 在浏览器内直接调用 API 创建 token/key
 * 利用浏览器已有的 session cookie
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const log = (msg) => console.log(`[v5] ${msg}`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  log('连接 Edge...');
  const resp = await fetch('http://localhost:9222/json/version');
  const version = await resp.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: version.webSocketDebuggerUrl });
  log('已连接');

  const results = {};

  // ==================== Vercel Token ====================
  log('\n===== Vercel Token (API 方式) =====');
  const vpage = await browser.newPage();
  try {
    // 先导航到 Vercel 确保有 session cookie
    await vpage.goto('https://vercel.com/account/settings/tokens', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(3000);
    log(`Vercel URL: ${vpage.url()}`);

    // 在浏览器内调用 API 创建 token
    const tokenResult = await vpage.evaluate(async () => {
      // 尝试不同的 API 端点
      const endpoints = [
        '/api/tokens',
        '/api/user/tokens',
        '/v3/user/tokens',
        '/api/account/tokens',
      ];

      for (const endpoint of endpoints) {
        try {
          const url = endpoint.startsWith('http') ? endpoint : `https://api.vercel.com${endpoint}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'textbook-ing-deploy',
              scope: 'full',
              expiration: null,
            }),
          });

          const text = await res.text();
          let data;
          try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 200) }; }

          if (res.ok) {
            return { success: true, endpoint, data };
          } else {
            // 记录错误但继续尝试
            if (res.status !== 404) {
              return { success: false, endpoint, status: res.status, data };
            }
          }
        } catch (e) {
          // 继续尝试下一个
        }
      }
      return { success: false, error: '所有端点都失败' };
    });

    log(`Vercel API 结果: ${JSON.stringify(tokenResult).slice(0, 500)}`);

    if (tokenResult.success && tokenResult.data) {
      // 查找 token 值
      const data = tokenResult.data;
      const token = data.token || data.accessToken || data.value || data.id ||
                    (typeof data === 'string' ? data : null);
      if (token) {
        log(`✓ Vercel Token: ${String(token).slice(0, 15)}...`);
        results.vercelToken = String(token);
      } else {
        log(`API 返回数据: ${JSON.stringify(data).slice(0, 500)}`);
        // 尝试从数据中查找 token 格式的字符串
        const dataStr = JSON.stringify(data);
        const tokenMatch = dataStr.match(/"([a-zA-Z0-9_\-]{30,})"/);
        if (tokenMatch) {
          log(`从数据中提取到 token: ${tokenMatch[1].slice(0, 15)}...`);
          results.vercelToken = tokenMatch[1];
        }
      }
    } else if (tokenResult.data) {
      // 如果有错误信息，分析它
      log(`API 错误: ${JSON.stringify(tokenResult.data).slice(0, 300)}`);

      // 尝试使用 GraphQL
      const gqlResult = await vpage.evaluate(async () => {
        try {
          const res = await fetch('https://api.vercel.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `mutation CreateToken($name: String!, $scope: TokenScope!) {
                createToken(name: $name, scope: $scope) {
                  token
                  id
                }
              }`,
              variables: { name: 'textbook-ing-deploy', scope: 'FULL' },
            }),
          });
          const text = await res.text();
          return { status: res.status, text: text.slice(0, 500) };
        } catch (e) {
          return { error: e.message };
        }
      });
      log(`GraphQL 结果: ${JSON.stringify(gqlResult).slice(0, 300)}`);
    }
  } catch (e) {
    log(`Vercel 异常: ${e.message}`);
  }
  await vpage.close();

  // ==================== Neon API Key ====================
  log('\n===== Neon API Key (API 方式) =====');
  const npage = await browser.newPage();
  try {
    await npage.goto('https://console.neon.tech/app/settings', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    log(`Neon URL: ${npage.url()}`);

    // 在浏览器内调用 Neon API
    const keyResult = await npage.evaluate(async () => {
      const endpoints = [
        'https://console.neon.tech/api/v2/api_keys',
        'https://console.neon.tech/api/v1/api_keys',
        '/api/v2/api_keys',
        '/api/api_keys',
      ];

      for (const endpoint of endpoints) {
        try {
          const url = endpoint.startsWith('http') ? endpoint : `https://console.neon.tech${endpoint}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'textbook-ing' }),
          });

          const text = await res.text();
          let data;
          try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 200) }; }

          if (res.ok) {
            return { success: true, endpoint, data };
          } else if (res.status !== 404) {
            return { success: false, endpoint, status: res.status, data };
          }
        } catch (e) {}
      }
      return { success: false, error: '所有端点都失败' };
    });

    log(`Neon API 结果: ${JSON.stringify(keyResult).slice(0, 500)}`);

    if (keyResult.success && keyResult.data) {
      const data = keyResult.data;
      const apiKey = data.key || data.api_key || data.token || data.id ||
                     (typeof data === 'string' ? data : null);
      if (apiKey) {
        log(`✓ Neon API Key: ${String(apiKey).slice(0, 20)}...`);
        results.neonApiKey = String(apiKey);
      } else {
        log(`API 返回: ${JSON.stringify(data).slice(0, 500)}`);
        const dataStr = JSON.stringify(data);
        const keyMatch = dataStr.match(/"([a-f0-9]{40,})"/i) || dataStr.match(/"(neon_[a-zA-Z0-9]+)"/);
        if (keyMatch) {
          log(`从数据中提取到 key: ${keyMatch[1].slice(0, 20)}...`);
          results.neonApiKey = keyMatch[1];
        }
      }
    } else if (keyResult.data) {
      log(`API 错误: ${JSON.stringify(keyResult.data).slice(0, 300)}`);
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
