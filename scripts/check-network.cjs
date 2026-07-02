/**
 * 捕获所有网络请求，找出500错误
 */
const WebSocket = require('ws');

const wsUrl = process.argv[2];
const ws = new WebSocket(wsUrl);
let msgId = 1;
const requests = new Map();
const responses = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (msg) => {
      const data = JSON.parse(msg.toString());
      if (data.id === id) {
        ws.off('message', handler);
        if (data.error) reject(new Error(JSON.stringify(data.error)));
        else resolve(data.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { ws.off('message', handler); reject(new Error('超时')); }, 15000);
  });
}

async function main() {
  await new Promise((r, rej) => { ws.on('open', r); ws.on('error', rej); });

  await send('Network.enable');
  await send('Page.enable');

  ws.on('message', (msg) => {
    const data = JSON.parse(msg.toString());
    if (data.method === 'Network.requestWillBeSent') {
      requests.set(data.params.requestId, {
        url: data.params.request.url,
        method: data.params.request.method,
      });
    } else if (data.method === 'Network.responseReceived') {
      const r = data.params.response;
      responses.set(data.params.requestId, {
        url: r.url,
        status: r.status,
        statusText: r.statusText,
      });
    }
  });

  console.log('[1] 重新加载首页...');
  await send('Page.navigate', { url: 'https://textbook-ing.vercel.app/' });
  await new Promise(r => setTimeout(r, 8000));

  console.log('\n[2] 所有网络请求:');
  for (const [id, req] of requests) {
    const resp = responses.get(id);
    const status = resp ? resp.status : '无响应';
    const mark = (resp && resp.status >= 400) ? ' ⚠️' : '';
    console.log(`  ${req.method} ${status} ${req.url}${mark}`);
  }

  console.log('\n[3] 错误请求汇总:');
  let hasError = false;
  for (const [id, resp] of responses) {
    if (resp.status >= 400) {
      hasError = true;
      const req = requests.get(id);
      console.log(`  ${req?.method || '?'} ${resp.status} ${resp.url}`);
    }
  }
  if (!hasError) console.log('  无错误请求');

  ws.close();
}

main().catch(e => { console.error('执行失败:', e.message); process.exit(1); });
