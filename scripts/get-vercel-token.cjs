/**
 * 通过 Edge 浏览器 CDP 获取 Vercel Token
 * 方法：通过 CDP 获取 vercel.com 的 cookie，然后用 cookie 调用 Vercel API 创建 token
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_BASE = 'http://localhost:9222';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    }).on('error', reject);
  });
}

// 通过 CDP 获取指定标签页的 cookies
async function getCookies(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;

    ws.on('open', () => {
      // 获取所有 cookies
      ws.send(JSON.stringify({
        id: id++,
        method: 'Network.getCookies',
        params: { urls: ['https://vercel.com', 'https://api.vercel.com', 'https://*.vercel.com'] },
      }));
    });

    const cookies = [];
    ws.on('message', (msg) => {
      const data = JSON.parse(msg.toString());
      if (data.id === 1 && data.result) {
        cookies.push(...(data.result.cookies || []));
        ws.close();
        resolve(cookies);
      }
    });

    ws.on('error', reject);
    setTimeout(() => { ws.close(); reject(new Error('超时')); }, 15000);
  });
}

// 通过 CDP 在页面中执行 JS
async function evaluateJS(wsUrl, expression, awaitPromise = true) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression, returnByValue: true, awaitPromise, userGesture: true },
      }));
    });

    ws.on('message', (msg) => {
      const data = JSON.parse(msg.toString());
      if (data.id === 1) {
        ws.close();
        if (data.error) reject(new Error(JSON.stringify(data.error)));
        else resolve(data.result?.result?.value);
      }
    });

    ws.on('error', reject);
    setTimeout(() => { ws.close(); reject(new Error('超时')); }, 30000);
  });
}

async function main() {
  console.log('[1] 获取标签页列表...');
  const tabs = await httpGet(`${CDP_BASE}/json`);
  const vercelTab = tabs.find(t => t.url && t.url.includes('vercel.com'));

  if (!vercelTab) {
    console.error('未找到 Vercel 标签页，请先在 Edge 中打开 https://vercel.com/dashboard');
    process.exit(1);
  }

  console.log(`[2] 找到 Vercel 标签页: ${vercelTab.url}`);

  // 方法1：通过 CDP 获取 cookies
  console.log('[3] 获取 Vercel cookies...');
  let cookies;
  try {
    cookies = await getCookies(vercelTab.webSocketDebuggerUrl);
    console.log(`    获取到 ${cookies.length} 个 cookies`);

    // 筛选认证相关 cookies
    const authCookies = cookies.filter(c =>
      c.name.includes('token') ||
      c.name.includes('auth') ||
      c.name.includes('session') ||
      c.name.includes('jwt') ||
      c.name.startsWith('_') ||
      c.name === 'authorization'
    );
    console.log(`    认证相关 cookies: ${authCookies.map(c => c.name).join(', ')}`);
  } catch (err) {
    console.error(`    获取 cookies 失败: ${err.message}`);
  }

  // 构建 cookie 字符串
  const cookieStr = (cookies || []).map(c => `${c.name}=${c.value}`).join('; ');

  if (cookieStr) {
    console.log('[4] 尝试用 cookie 调用 Vercel API...');

    // 用 Node.js 的 fetch 调用 Vercel API
    try {
      const userResp = await fetch('https://api.vercel.com/v2/user', {
        headers: { Cookie: cookieStr },
      });
      const userData = await userResp.json();

      if (userData.user) {
        console.log(`    已登录: ${userData.user.email} (${userData.user.name || userData.user.username})`);

        // 创建 token
        console.log('[5] 创建新的 Vercel Token...');
        const tokenName = `deploy-${Date.now()}`;
        const tokenResp = await fetch('https://api.vercel.com/v3/user/tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieStr,
          },
          body: JSON.stringify({
            name: tokenName,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          }),
        });
        const tokenData = await tokenResp.json();

        console.log(`    Token 响应结构: ${JSON.stringify(tokenData).substring(0, 200)}`);

        // Vercel API 返回 { token: {元数据}, bearerToken: "vcp_xxx" }
        const tokenValue = tokenData.bearerToken || (typeof tokenData.token === 'string' ? tokenData.token : tokenData.token?.value);

        if (tokenValue) {
          console.log('\n========================================');
          console.log('VERCEL_TOKEN 获取成功！');
          console.log(`Token: ${tokenValue.substring(0, 20)}...${tokenValue.substring(tokenValue.length - 10)}`);
          console.log('========================================\n');

          const fs = require('fs');
          const path = require('path');
          const tokenFile = path.join(__dirname, '.vercel-token');
          fs.writeFileSync(tokenFile, String(tokenValue), { mode: 0o600 });
          console.log(`Token 已保存到: ${tokenFile}`);
          return;
        } else {
          console.error(`    Token 创建失败: ${JSON.stringify(tokenData).substring(0, 300)}`);
        }
      } else {
        console.log(`    用户信息响应: ${JSON.stringify(userData).substring(0, 200)}`);
      }
    } catch (err) {
      console.error(`    API 调用失败: ${err.message}`);
    }
  }

  // 方法2：在页面中直接执行 fetch（使用 credentials）
  console.log('\n[备用] 在 Vercel 页面中执行 fetch...');
  await new Promise(r => setTimeout(r, 2000));

  try {
    const result = await evaluateJS(
      vercelTab.webSocketDebuggerUrl,
      `(async () => {
        try {
          const r = await fetch('https://api.vercel.com/v2/user', { credentials: 'include' });
          const d = await r.json();
          return JSON.stringify({ status: r.status, hasUser: !!d.user, email: d.user?.email });
        } catch(e) {
          return JSON.stringify({ error: e.message, stack: e.stack });
        }
      })()`
    );
    console.log(`    页面内 fetch 结果: ${result}`);
  } catch (err) {
    console.error(`    页面内 fetch 失败: ${err.message}`);
  }

  // 方法3：尝试通过 vercel.com 的内部 API 端点
  console.log('\n[备用2] 尝试 vercel.com 的内部端点...');
  try {
    const result2 = await evaluateJS(
      vercelTab.webSocketDebuggerUrl,
      `(async () => {
        try {
          const r = await fetch('/api/user', { credentials: 'include' });
          const d = await r.json();
          return JSON.stringify({ status: r.status, data: JSON.stringify(d).substring(0, 300) });
        } catch(e) {
          return JSON.stringify({ error: e.message });
        }
      })()`
    );
    console.log(`    /api/user 结果: ${result2}`);
  } catch (err) {
    console.error(`    /api/user 失败: ${err.message}`);
  }
}

main().catch(err => {
  console.error('执行失败:', err.message);
  process.exit(1);
});
