/**
 * 通过CDP检查首页登录按钮状态
 */
const WebSocket = require('ws');

const wsUrl = process.argv[2];

async function evaluateJS(expression, awaitPromise = true) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;

    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: id++,
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
    setTimeout(() => { ws.close(); reject(new Error('超时')); }, 15000);
  });
}

async function main() {
  console.log('[1] 当前URL:');
  const url = await evaluateJS('window.location.href');
  console.log('    ' + url);

  console.log('\n[2] 检查Vue应用状态:');
  const vueApp = await evaluateJS(`
    const app = document.querySelector('#app');
    const vue = app?.__vue_app__;
    JSON.stringify({
      hasApp: !!vue,
      hasRouter: !!vue?.config?.globalProperties?.$router,
      currentRoute: vue?.config?.globalProperties?.$router?.currentRoute?.value?.fullPath
    })
  `);
  console.log('    ' + vueApp);

  console.log('\n[3] 检查登录按钮:');
  const loginBtn = await evaluateJS(`
    const btns = Array.from(document.querySelectorAll('a, button'));
    const loginBtn = btns.find(b => b.textContent.includes('登录'));
    JSON.stringify({
      found: !!loginBtn,
      tag: loginBtn?.tagName,
      href: loginBtn?.getAttribute('href'),
      text: loginBtn?.textContent?.trim(),
      classes: loginBtn?.className,
      display: loginBtn ? getComputedStyle(loginBtn).display : null,
      visible: loginBtn ? (loginBtn.offsetWidth > 0 && loginBtn.offsetHeight > 0) : null
    })
  `);
  console.log('    ' + loginBtn);

  console.log('\n[4] 检查控制台错误:');
  const errors = await evaluateJS(`
    (function() {
      // 无法直接获取历史错误，但可以检查页面是否有错误提示
      const errors = [];
      document.querySelectorAll('[class*="error"], [class*="Error"]').forEach(e => {
        if (e.textContent.trim()) errors.push(e.textContent.trim().substring(0, 100));
      });
      return JSON.stringify(errors);
    })()
  `);
  console.log('    ' + errors);

  console.log('\n[5] 检查所有链接:');
  const links = await evaluateJS(`
    Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.textContent.trim().substring(0, 30),
      href: a.getAttribute('href')
    })).filter(a => a.text || a.href).slice(0, 10)
  `, false);
  console.log('    ' + JSON.stringify(links));

  console.log('\n[6] 模拟点击登录按钮:');
  const clickResult = await evaluateJS(`
    (function() {
      const btns = Array.from(document.querySelectorAll('a, button'));
      const loginBtn = btns.find(b => b.textContent.includes('登录'));
      if (!loginBtn) return JSON.stringify({ success: false, error: '未找到登录按钮' });
      
      const href = loginBtn.getAttribute('href');
      loginBtn.click();
      
      return JSON.stringify({
        success: true,
        href: href,
        clicked: true,
        newUrl: window.location.href
      });
    })()
  `);
  console.log('    ' + clickResult);

  // 等待跳转
  await new Promise(r => setTimeout(r, 2000));

  console.log('\n[7] 点击后URL:');
  const afterUrl = await evaluateJS('window.location.href');
  console.log('    ' + afterUrl);
}

main().catch(err => {
  console.error('执行失败:', err.message);
  process.exit(1);
});
