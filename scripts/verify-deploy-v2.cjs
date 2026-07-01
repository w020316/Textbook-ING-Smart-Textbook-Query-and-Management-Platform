/**
 * v2 验证脚本：改进 API 测试方式
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const log = (msg) => console.log(`[v2] ${msg}`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  log('连接 Edge...');
  const resp = await fetch('http://localhost:9222/json/version');
  const version = await resp.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: version.webSocketDebuggerUrl });

  const BASE = 'https://textbook-ing.vercel.app';
  const results = [];

  // 1. 测试首页（SPA）
  log('\n===== 测试首页 =====');
  const homePage = await browser.newPage();
  try {
    await homePage.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);
    const title = await homePage.title();
    const text = await homePage.evaluate(() => document.body ? document.body.innerText : '');
    log(`  title: ${title}`);
    log(`  body 长度: ${text.length}`);
    log(`  预览: ${text.slice(0, 200).replace(/\s+/g, ' ')}`);
    const passed = text.length > 50 && /教材|ING|Textbook|登录|搜索/i.test(text);
    results.push({ name: '首页', passed, detail: `title=${title}, len=${text.length}` });
  } catch (e) {
    log(`  异常: ${e.message}`);
    results.push({ name: '首页', passed: false, error: e.message });
  }
  await homePage.close();

  // 2. 测试 API（用 fetch，不跟随重定向）
  log('\n===== 测试 API =====');
  const apiPage = await browser.newPage();
  try {
    await apiPage.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const apiTests = [
      { url: '/api/news/categories', name: '新闻分类' },
      { url: '/api/semesters', name: '学期列表' },
      { url: '/api/auth/login', name: '登录', method: 'POST', body: { email: 'admin@textbook-ing.com', password: 'admin123' } },
    ];
    
    for (const t of apiTests) {
      const result = await apiPage.evaluate(async (t) => {
        try {
          const opts = { method: t.method || 'GET', headers: { 'Content-Type': 'application/json' } };
          if (t.body) opts.body = JSON.stringify(t.body);
          const res = await fetch(t.url, opts);
          const text = await res.text();
          let data;
          try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 200) }; }
          return { status: res.status, data, textLen: text.length };
        } catch (e) {
          return { error: e.message };
        }
      }, t);
      
      log(`\n  ${t.name} (${t.url}):`);
      log(`    结果: ${JSON.stringify(result).slice(0, 400)}`);
      const passed = result.status === 200 && result.data && (result.data.code === 0 || result.data.token);
      results.push({ name: t.name, passed, detail: JSON.stringify(result).slice(0, 200) });
    }
  } catch (e) {
    log(`  异常: ${e.message}`);
  }
  await apiPage.close();

  // 汇总
  console.log('\n========================================');
  console.log('部署验证结果 v2');
  console.log('========================================');
  results.forEach(r => {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}: ${(r.detail || r.error || '').slice(0, 100)}`);
  });
  const passed = results.filter(r => r.passed).length;
  console.log(`\n通过: ${passed}/${results.length}`);

  // 保存结果
  const creds = JSON.parse(fs.readFileSync('.deploy-creds.json', 'utf8'));
  creds.verification = {
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
