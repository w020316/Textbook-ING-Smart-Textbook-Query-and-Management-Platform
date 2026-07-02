const WebSocket = require('ws');
const wsUrl = process.argv[2];
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `(function(){
        const btns = Array.from(document.querySelectorAll('a,button'));
        const loginBtns = btns.filter(b => b.textContent.includes('登录') || b.textContent.includes('登录 / 注册'));
        return JSON.stringify(loginBtns.map(b => ({
          text: b.textContent.trim().substring(0, 30),
          href: b.getAttribute('href'),
          classes: b.className,
          visible: b.offsetWidth > 0 && b.offsetHeight > 0,
          display: getComputedStyle(b).display
        })));
      })()`,
      returnByValue: true
    }
  }));
});

ws.on('message', (m) => {
  const d = JSON.parse(m.toString());
  if (d.id === 1) {
    ws.close();
    console.log(d.result?.result?.value);
  }
});

ws.on('error', (e) => { console.error(e.message); process.exit(1); });
setTimeout(() => { ws.close(); process.exit(0); }, 10000);
