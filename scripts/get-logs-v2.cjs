/**
 * 通过 CDP 在 Vercel 页面执行 fetch 获取部署运行时日志
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

function cdpEvaluate(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    ws.on('open', () => {
      // 启用 Runtime
      ws.send(JSON.stringify({ id: msgId++, method: 'Runtime.enable' }));
    });
    ws.on('message', (msg) => {
      const data = JSON.parse(msg.toString());
      if (data.id === 2 && data.result) {
        ws.close();
        resolve(data.result);
      }
    });
    ws.on('open', () => {
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: { expression, awaitPromise: true, returnByValue: true },
        }));
      }, 500);
    });
    ws.on('error', reject);
    setTimeout(() => { ws.close(); reject(new Error('timeout')); }, 30000);
  });
}

async function main() {
  const deploymentId = process.argv[2] || 'dpl_EhKXgKSEaqDVof3qZ3LvnBjoYNm9';
  console.log('Deployment ID:', deploymentId);

  const tabs = await httpGet('http://localhost:9222/json');
  const vTab = tabs.find(t => t.url && t.url.includes('vercel.com'));
  if (!vTab) { console.error('No Vercel tab'); process.exit(1); }

  console.log('Vercel tab:', vTab.url);

  // 在 Vercel 页面执行 fetch 获取运行时日志（用相对路径避免 CORS）
  const expression = `
    (async () => {
      try {
        const teamId = 'team_pdaobxPxJ2Bm369qHJh0WWQc';
        const resp = await fetch('/api/v1/deployments/${deploymentId}/logs?teamId=' + teamId + '&limit=100', {
          credentials: 'include'
        });
        const text = await resp.text();
        return JSON.stringify({ status: resp.status, body: text.substring(0, 8000) });
      } catch(e) {
        return JSON.stringify({ error: e.message });
      }
    })()
  `;

  console.log('Fetching logs...');
  const result = await cdpEvaluate(vTab.webSocketDebuggerUrl, expression);
  console.log('Result:', result.result?.value || JSON.stringify(result));
}

main().catch(e => { console.error('Failed:', e.message); process.exit(1); });
