const WebSocket = require('ws');
const wsUrl = process.argv[2];

async function evaluate(ws, expression) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000) + 1;
    ws.send(JSON.stringify({
      id,
      method: 'Runtime.evaluate',
      params: { expression, returnByValue: true, awaitPromise: true, userGesture: true },
    }));

    const handler = (msg) => {
      const data = JSON.parse(msg.toString());
      if (data.id === id) {
        ws.off('message', handler);
        if (data.error) reject(new Error(JSON.stringify(data.error)));
        else resolve(data.result?.result?.value);
      }
    };
    ws.on('message', handler);
  });
}

async function main() {
  const ws = new WebSocket(wsUrl);
  await new Promise((r, rej) => { ws.on('open', r); ws.on('error', rej); });

  // 1. 模拟移动端
  console.log('=== 模拟移动端视口 ===');
  await evaluate(ws, `document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=375')`);

  // 2. 检查移动端汉堡菜单
  console.log('\n=== 检查移动端汉堡菜单 ===');
  const menuBtn = await evaluate(ws, `(function(){
    const btns = Array.from(document.querySelectorAll('button[aria-label="菜单"]'));
    return JSON.stringify({
      found: btns.length > 0,
      visible: btns.length > 0 ? (btns[0].offsetWidth > 0 && btns[0].offsetHeight > 0) : false
    });
  })()`);
  console.log('汉堡菜单: ' + menuBtn);

  // 3. 点击汉堡菜单
  console.log('\n=== 点击汉堡菜单 ===');
  await evaluate(ws, `(function(){
    const btn = document.querySelector('button[aria-label="菜单"]');
    if (btn) btn.click();
    return 'clicked';
  })()`);

  await new Promise(r => setTimeout(r, 500));

  // 4. 检查移动端菜单中的登录链接
  console.log('\n=== 检查移动端菜单内容 ===');
  const mobileMenu = await evaluate(ws, `(function(){
    const links = Array.from(document.querySelectorAll('a'));
    const loginLinks = links.filter(a => a.textContent.includes('登录'));
    return JSON.stringify(loginLinks.map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href'),
      visible: a.offsetWidth > 0 && a.offsetHeight > 0
    })));
  })()`);
  console.log('移动端登录链接: ' + mobileMenu);

  // 5. 恢复桌面端
  console.log('\n=== 恢复桌面端视口 ===');
  await evaluate(ws, `document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0')`);

  ws.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
