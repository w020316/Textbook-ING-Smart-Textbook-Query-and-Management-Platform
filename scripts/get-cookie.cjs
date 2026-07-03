/**
 * 直接获取 Vercel authorization cookie
 */
const WebSocket = require('ws');
const http = require('http');

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

async function getCookies(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Network.getCookies',
        params: { urls: ['https://vercel.com', 'https://api.vercel.com'] },
      }));
    });

    ws.on('message', (msg) => {
      const data = JSON.parse(msg.toString());
      if (data.id === 1 && data.result) {
        ws.close();
        resolve(data.result.cookies || []);
      }
    });

    ws.on('error', reject);
    setTimeout(() => { ws.close(); reject(new Error('超时')); }, 15000);
  });
}

async function main() {
  const tabs = await httpGet('http://localhost:9222/json');
  const vTab = tabs.find(t => t.url && t.url.includes('vercel.com'));

  if (!vTab) {
    console.error('未找到 Vercel 标签页');
    process.exit(1);
  }

  console.log('Vercel 标签页:', vTab.url);
  console.log('\n获取 cookies...');

  const cookies = await getCookies(vTab.webSocketDebuggerUrl);

  // 找 authorization cookie
  const authCookie = cookies.find(c => c.name === 'authorization');
  if (authCookie) {
    console.log('\nauthorization cookie:');
    console.log('  value:', authCookie.value.substring(0, 50) + '...');
    console.log('  length:', authCookie.value.length);

    // 检查是否是 JWT
    if (authCookie.value.startsWith('eyJ')) {
      console.log('  类型: JWT');
    }

    // 保存为 token
    const fs = require('fs');
    const path = require('path');
    fs.writeFileSync(path.join(__dirname, '.vercel-token'), authCookie.value);
    console.log('\nToken 已保存到 scripts/.vercel-token');

    // 验证 token 是否可用
    console.log('\n验证 token...');
    try {
      const resp = await fetch('https://api.vercel.com/v2/user', {
        headers: { 'Authorization': `Bearer ${authCookie.value}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        console.log('✓ Token 有效！用户:', data.user?.email);
      } else {
        console.log('✗ Token 无效:', resp.status);
        // 尝试作为 cookie 使用
        console.log('\n尝试作为 cookie 使用...');
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        const resp2 = await fetch('https://api.vercel.com/v2/user', {
          headers: { Cookie: cookieStr },
        });
        if (resp2.ok) {
          const data2 = await resp2.json();
          console.log('✓ Cookie 方式有效！用户:', data2.user?.email);
          // 保存 cookie 字符串
          fs.writeFileSync(path.join(__dirname, '.vercel-cookie'), cookieStr);
          console.log('Cookie 已保存到 scripts/.vercel-cookie');
        } else {
          console.log('✗ Cookie 方式也无效:', resp2.status);
        }
      }
    } catch (e) {
      console.log('验证失败:', e.message);
    }
  } else {
    console.log('未找到 authorization cookie');
    console.log('所有 cookies:', cookies.map(c => c.name).join(', '));
  }
}

main().catch(e => { console.error('失败:', e.message); process.exit(1); });
