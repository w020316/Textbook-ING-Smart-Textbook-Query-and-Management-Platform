/**
 * CDP 深度诊断脚本
 * 捕获控制台错误、网络请求，模拟点击登录按钮
 */
const WebSocket = require('ws');

const wsUrl = process.argv[2];
if (!wsUrl) {
  console.error('用法: node scripts/diagnose.cjs <wsUrl>');
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
let msgId = 1;
const consoleLogs = [];
const networkErrors = [];
const jsErrors = [];

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

  // 启用Console和Network域
  await send('Console.enable');
  await send('Network.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  // 监听事件
  ws.on('message', (msg) => {
    const data = JSON.parse(msg.toString());
    if (data.method === 'Runtime.consoleAPICalled') {
      const args = data.params.args.map(a => a.value || a.description || '').join(' ');
      consoleLogs.push(`[${data.params.type}] ${args}`);
    } else if (data.method === 'Runtime.exceptionThrown') {
      const ex = data.params.exceptionDetails;
      jsErrors.push(`${ex.text}: ${ex.exception?.description?.substring(0, 300) || ''}`);
    } else if (data.method === 'Log.entryAdded') {
      const entry = data.params.entry;
      if (entry.level === 'error' || entry.level === 'warning') {
        consoleLogs.push(`[Log.${entry.level}] ${entry.text}`);
      }
    } else if (data.method === 'Network.loadingFailed') {
      networkErrors.push(`${data.params.url} (${data.params.errorText})`);
    }
  });

  console.log('[2] 重新加载页面以捕获所有错误...');
  await send('Page.enable');
  await send('Page.reload', { ignoreCache: true });

  // 等待页面加载
  await new Promise(r => setTimeout(r, 5000));
  console.log('[3] 页面已加载');

  // 检查当前URL
  const url = await evaluate('window.location.href');
  console.log('\n[4] 当前URL: ' + url);

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
    const loginBtns = btns.filter(b => b.textContent.includes('登录'));
    return JSON.stringify(loginBtns.map(b => ({
      tag: b.tagName,
      text: b.textContent.trim().substring(0, 20),
      href: b.getAttribute('href'),
      classes: b.className,
      visible: b.offsetWidth > 0 && b.offsetHeight > 0,
      rect: b.getBoundingClientRect ? {
        x: b.getBoundingClientRect().x,
        y: b.getBoundingClientRect().y,
        w: b.getBoundingClientRect().width,
        h: b.getBoundingClientRect().height
      } : null
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

  // 模拟点击登录按钮
  console.log('\n[10] 模拟点击登录按钮...');
  const beforeUrl = await evaluate('window.location.href');
  console.log('  点击前URL: ' + beforeUrl);

  const clickResult = await evaluate(`(function(){
    const btns = Array.from(document.querySelectorAll('a, button'));
    const loginBtn = btns.find(b => b.textContent.includes('登录'));
    if (!loginBtn) return JSON.stringify({ error: '未找到登录按钮' });
    
    // 模拟真实点击事件序列
    const rect = loginBtn.getBoundingClientRect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    
    loginBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
    loginBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
    loginBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
    
    // 如果是<a>且有href，也直接设置location
    const href = loginBtn.getAttribute('href');
    
    return JSON.stringify({
      clicked: true,
      tag: loginBtn.tagName,
      href: href,
      isRouterLink: loginBtn.hasAttribute('data-v-' + 'router') || !!loginBtn.__vueParentComponent
    });
  })()`);
  console.log('  点击结果: ' + clickResult);

  // 等待跳转
  await new Promise(r => setTimeout(r, 2000));

  const afterUrl = await evaluate('window.location.href');
  console.log('  点击后URL: ' + afterUrl);

  if (afterUrl === beforeUrl) {
    console.log('\n[11] ⚠️ 点击后URL未变化！按钮可能无反应');
    
    // 尝试直接通过 router 跳转
    console.log('\n[12] 尝试直接通过 Vue Router 跳转...');
    const routerResult = await evaluate(`(function(){
      try {
        const app = document.querySelector('#app').__vue_app__;
        const router = app.config.globalProperties.$router;
        router.push('/login');
        return JSON.stringify({ success: true, currentRoute: router.currentRoute.value.fullPath });
      } catch(e) {
        return JSON.stringify({ error: e.message, stack: e.stack?.substring(0, 300) });
      }
    })()`);
    console.log('  Router跳转结果: ' + routerResult);
    
    await new Promise(r => setTimeout(r, 1000));
    const finalUrl = await evaluate('window.location.href');
    console.log('  最终URL: ' + finalUrl);
  } else {
    console.log('\n[11] ✓ 点击后URL已变化，按钮工作正常');
  }

  // 最终错误汇总
  console.log('\n[13] 最终错误汇总:');
  console.log('  JS错误: ' + jsErrors.length + ' 个');
  console.log('  控制台错误: ' + consoleLogs.filter(l => l.includes('error') || l.includes('Error')).length + ' 条');
  console.log('  网络错误: ' + networkErrors.length + ' 个');

  ws.close();
}

main().catch(e => { console.error('执行失败:', e.message); process.exit(1); });
