/**
 * 从 authorization cookie 提取 Vercel token 并部署
 */
const WebSocket = require('ws');
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  console.log('[1] 获取 Vercel cookies...');
  const tabs = await httpGet('http://localhost:9222/json');
  const vTab = tabs.find(t => t.url && t.url.includes('vercel.com'));
  if (!vTab) { console.error('未找到 Vercel 标签页'); process.exit(1); }

  const cookies = await getCookies(vTab.webSocketDebuggerUrl);
  const authCookie = cookies.find(c => c.name === 'authorization');

  if (!authCookie) { console.error('未找到 authorization cookie'); process.exit(1); }

  // cookie 值是 URL编码的 "Bearer vcp_xxx"
  const decoded = decodeURIComponent(authCookie.value);
  console.log('[2] 解码后的 authorization 值:', decoded.substring(0, 30) + '...');

  // 提取 token 部分（去掉 "Bearer " 前缀）
  const token = decoded.startsWith('Bearer ') ? decoded.substring(7) : decoded;
  console.log('[3] 提取的 token:', token.substring(0, 20) + '...' + token.substring(token.length - 10));
  console.log('    token 长度:', token.length);

  // 保存 token
  const tokenFile = path.join(__dirname, '.vercel-token');
  fs.writeFileSync(tokenFile, token);
  console.log('[4] Token 已保存');

  // 用 Vercel CLI 部署
  console.log('\n[5] 使用 Vercel CLI 部署...');
  try {
    const output = execSync(`npx --yes vercel deploy --prod --yes --token ${token}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      timeout: 180000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(output);

    // 检查是否成功
    if (output.includes('Ready') || output.includes('vercel.app')) {
      console.log('\n========================================');
      console.log('✓ 部署成功！');
      // 提取 URL
      const urlMatch = output.match(/https:\/\/[^\s]+vercel\.app/);
      if (urlMatch) console.log('URL:', urlMatch[0]);
      console.log('========================================');
    }
  } catch (e) {
    console.error('部署失败:', e.message);
    if (e.stdout) console.log('stdout:', e.stdout.toString().substring(0, 500));
    if (e.stderr) console.log('stderr:', e.stderr.toString().substring(0, 500));
    process.exit(1);
  }
}

main().catch(e => { console.error('失败:', e.message); process.exit(1); });
