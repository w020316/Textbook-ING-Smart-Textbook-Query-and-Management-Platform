/**
 * 最终验证：完整功能测试
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const log = (msg) => console.log(`[final] ${msg}`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const resp = await fetch('http://localhost:9222/json/version');
  const version = await resp.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: version.webSocketDebuggerUrl });

  const BASE = 'https://textbook-ing.vercel.app';
  const results = [];

  // 1. 首页
  log('\n===== 1. 首页 =====');
  const homePage = await browser.newPage();
  try {
    await homePage.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);
    const title = await homePage.title();
    const text = await homePage.evaluate(() => document.body ? document.body.innerText : '');
    log(`title: ${title}, body 长度: ${text.length}`);
    const passed = /教材|ING/i.test(title) && text.length > 100;
    results.push({ name: '首页加载', passed, detail: `title="${title}"` });
  } catch (e) {
    results.push({ name: '首页加载', passed: false, error: e.message });
  }
  await homePage.close();

  // 2. API 测试
  log('\n===== 2. API 测试 =====');
  const apiPage = await browser.newPage();
  await apiPage.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  const apiTests = [
    { url: '/api/semesters', name: '学期列表' },
    { url: '/api/news/categories', name: '新闻分类' },
    { url: '/api/news?page=1&pageSize=5', name: '新闻列表' },
  ];
  
  for (const t of apiTests) {
    const result = await apiPage.evaluate(async (url) => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        return { status: res.status, code: data.code, dataLen: data.data ? (Array.isArray(data.data) ? data.data.length : 1) : 0 };
      } catch (e) { return { error: e.message }; }
    }, t.url);
    log(`  ${t.name}: ${JSON.stringify(result)}`);
    const passed = result.status === 200 && result.code === 0 && result.dataLen > 0;
    results.push({ name: t.name, passed, detail: `${result.dataLen} 条数据` });
  }
  
  // 3. 登录测试
  log('\n===== 3. 登录测试 =====');
  const loginResult = await apiPage.evaluate(async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@textbook-ing.com', password: 'admin123' }),
      });
      const data = await res.json();
      return { status: res.status, code: data.code, hasToken: !!(data.data && data.data.token), user: data.data && data.data.user ? data.data.user.email : null };
    } catch (e) { return { error: e.message }; }
  });
  log(`  登录结果: ${JSON.stringify(loginResult)}`);
  const loginPassed = loginResult.status === 200 && loginResult.code === 0 && loginResult.hasToken;
  results.push({ name: '管理员登录', passed: loginPassed, detail: `token=${loginPassed}, user=${loginResult.user}` });

  // 4. 用 token 访问受保护 API
  if (loginPassed) {
    log('\n===== 4. 受保护 API 测试 =====');
    const token = await apiPage.evaluate(async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@textbook-ing.com', password: 'admin123' }),
      });
      const data = await res.json();
      return data.data.token;
    });
    
    const protectedApis = [
      { url: '/api/auth/me', name: '当前用户' },
      { url: '/api/textbooks?page=1&pageSize=5', name: '教材列表' },
      { url: '/api/colleges', name: '学院列表' },
    ];
    
    for (const t of protectedApis) {
      const result = await apiPage.evaluate(async (url, token) => {
        try {
          const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
          const data = await res.json();
          return { status: res.status, code: data.code, dataLen: data.data ? (Array.isArray(data.data) ? data.data.length : (typeof data.data === 'object' ? 1 : 0)) : 0 };
        } catch (e) { return { error: e.message }; }
      }, t.url, token);
      log(`  ${t.name}: ${JSON.stringify(result)}`);
      const passed = result.status === 200 && result.code === 0;
      results.push({ name: t.name, passed, detail: `${result.dataLen} 条数据` });
    }
  }
  
  await apiPage.close();

  // 汇总
  console.log('\n========================================');
  console.log('最终验证结果');
  console.log('========================================');
  results.forEach(r => {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}: ${(r.detail || r.error || '').slice(0, 80)}`);
  });
  const passed = results.filter(r => r.passed).length;
  console.log(`\n通过: ${passed}/${results.length}`);

  // 保存结果
  const creds = JSON.parse(fs.readFileSync('.deploy-creds.json', 'utf8'));
  creds.finalVerification = {
    time: new Date().toISOString(),
    results,
    passed: passed + '/' + results.length,
    productionUrl: BASE,
  };
  fs.writeFileSync('.deploy-creds.json', JSON.stringify(creds, null, 2), 'utf8');

  browser.disconnect();
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
