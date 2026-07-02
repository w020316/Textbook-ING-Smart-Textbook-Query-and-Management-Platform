/**
 * CDP 诊断首页登录按钮
 * 先导航到首页 /，然后诊断
 */
const WebSocket = require('ws');

const wsUrl = process.argv[2];
const ws = new WebSocket(wsUrl);
let msgId = 1;
const consoleLogs = [];
const jsErrors = [];
const networkErrors = [];

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
    setTimeout(() => { ws.off('message', handler); reject(new Error(`${method} 超时`)); }, 15000);
  });
}

async function evaluate(expression, awaitPromise = true) {
  const r = await send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise, userGesture: true,
  });
  return r?.result?.value;
}

async function main() {
  await new Promise((r, rej) => { ws.on('open', r); ws.on('error', rej); });
  console.log('[1] WebSocket已连接');

  // 启用域
  await send('Console.enable');
  await send('Network.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');

  // 监听事件
  ws.on('message', (msg) => {
    const data = JSON.parse(msg.toString());
    if (data.method === 'Runtime.consoleAPICalled') {
      const args = data.params.args.map(a => a.value || a.description || '').join(' ');
      consoleLogs.push(`[${data.params.type}] ${args}`);
    } else if (data.method === 'Runtime.exceptionThrown') {
      const ex = data.params.exceptionDetails;
      jsErrors.push(`${ex.text}: ${ex.exception?.description?.substring(0, 500) || ''}`);
    } else if (data.method === 'Log.entryAdded') {
      const entry = data.params.entry;
      if (entry.level === 'error' || entry.level === 'warning') {
        consoleLogs.push(`[Log.${entry.level}] ${entry.text}`);
      }
    } else if (data.method === 'Network.loadingFailed') {
      networkErrors.push(`${data.params.url} (${data.params.errorText})`);
    }
  });

  // 导航到首页
  console.log('[2] 导航到首页 https://textbook-ing.vercel.app/ ...');
  await send('Page.navigate', { url: 'https://textbook-ing.vercel.app/' });
  await new Promise(r => setTimeout(r, 6000));
  console.log('[3] 首页已加载');

  const url = await evaluate('window.location.href');
  console.log('[4] 当前URL: ' + url);

  // 检查Vue应用
  const vueInfo = await evaluate(`JSON.stringify({
    hasApp: !!document.querySelector('#app')?.__vue_app__,
    appHtml: document.querySelector('#app')?.innerHTML?.length || 0,
    hasRouter: !!document.querySelector('#app')?.__vue_app__?.config?.globalProperties?.$router,
    route: document.querySelector('#app')?.__vue_app__?.config?.globalProperties?.$router?.currentRoute?.value?.fullPath
  })`);
  console.log('[5] Vue应用状态: ' + vueInfo);

  // 检查登录按钮
  const btnInfo = await evaluate(`(function(){
    const btns = Array.from(document.querySelectorAll('a, button'));
    const loginBtns = btns.filter(b => b.textContent.trim() === '登录' || b.textContent.includes('登录'));
    return JSON.stringify(loginBtns.map(b => ({
      tag: b.tagName,
      text: b.textContent.trim().substring(0, 30),
      href: b.getAttribute('href'),
      classes: b.className,
      visible: b.offsetWidth > 0 && b.offsetHeight > 0,
      rect: b.getBoundingClientRect ? {
        x: Math.round(b.getBoundingClientRect().x),
        y: Math.round(b.getBoundingClientRect().y),
        w: Math.round(b.getBoundingClientRect().width),
        h: Math.round(b.getBoundingClientRect().height)
      } : null,
      hasVueClick: !!b.__vueParentComponent,
      onclick: b.onclick ? 'has onclick' : 'no onclick'
    })));
  })()`);
  console.log('\n[6] 登录按钮信息: ' + btnInfo);

  // 检查所有错误
  console.log('\n[7] JS运行时错误 (' + jsErrors.length + ' 个):');
  jsErrors.forEach((e, i) => console.log(`  ${i+1}. ${e}`));

  console.log('\n[8] 控制台日志 (' + consoleLogs.length + ' 条):');
  consoleLogs.forEach((e, i) => console.log(`  ${i+1}. ${e}`));

  console.log('\n[9] 网络错误 (' + networkErrors.length + ' 个):');
  networkErrors.forEach((e, i) => console.log(`  ${i+1}. ${e}`));

  // 模拟点击首页的登录按钮（应该是 <a> 标签）
  console.log('\n[10] 模拟点击首页登录按钮...');
  const beforeUrl = await evaluate('window.location.href');
  console.log('  点击前URL: ' + beforeUrl);

  const clickResult = await evaluate(`(function(){
    const btns = Array.from(document.querySelectorAll('a, button'));
    // 找首页AppHeader中的登录链接（<a> 标签，href="/login"）
    const loginLink = btns.find(b => b.tagName === 'A' && b.getAttribute('href') === '/login');
    if (!loginLink) return JSON.stringify({ error: '未找到登录链接', allBtns: btns.map(b => ({tag: b.tagName, text: b.textContent.trim().substring(0,20), href: b.getAttribute('href')})) });
    
    const rect = loginLink.getBoundingClientRect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    
    loginLink.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
    loginLink.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
    loginLink.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
    
    return JSON.stringify({
      clicked: true,
      tag: loginLink.tagName,
      href: loginLink.getAttribute('href'),
      rect: { x: Math.round(x), y: Math.round(y) }
    });
  })()`);
  console.log('  点击结果: ' + clickResult);

  await new Promise(r => setTimeout(r, 2000));

  const afterUrl = await evaluate('window.location.href');
  console.log('  点击后URL: ' + afterUrl);

  if (afterUrl === beforeUrl) {
    console.log('\n[11] ⚠️ 点击后URL未变化！');
    
    // 检查是否有阻止默认行为的代码
    const checkDefault = await evaluate(`(function(){
      const loginLink = Array.from(document.querySelectorAll('a')).find(a => a.getAttribute('href') === '/login');
      if (!loginLink) return '未找到链接';
      
      // 检查Vue组件
      let el = loginLink;
      let vueInfo = [];
      while (el) {
        if (el.__vueParentComponent) {
          vueInfo.push({
            tag: el.__vueParentComponent?.type?.__name || el.__vueParentComponent?.type?.name || 'unknown',
            hasClick: !!(el.__vueParentComponent?.type?.setup)
          });
        }
        el = el.parentElement;
      }
      return JSON.stringify({ vueComponents: vueInfo });
    })()`);
    console.log('  Vue组件检查: ' + checkDefault);
  } else {
    console.log('\n[11] ✓ 点击后URL已变化，首页登录按钮工作正常！');
  }

  // 最终汇总
  console.log('\n[12] 最终汇总:');
  console.log('  JS错误: ' + jsErrors.length + ' 个');
  console.log('  控制台日志: ' + consoleLogs.length + ' 条');
  console.log('  网络错误: ' + networkErrors.length + ' 个');

  ws.close();
}

main().catch(e => { console.error('执行失败:', e.message); process.exit(1); });
