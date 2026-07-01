/**
 * 验证部署：在浏览器中访问 Vercel 部署的网站，测试首页和 API
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const log = (msg) => console.log(`[verify] ${msg}`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const URLs = [
  { url: 'https://textbook-ing.vercel.app/', name: '首页', expect: /教材|ING|Textbook/i },
  { url: 'https://textbook-ing.vercel.app/api/health', name: '健康检查 API', expect: /code|status|ok/i },
  { url: 'https://textbook-ing.vercel.app/api/news/categories', name: '新闻分类 API', expect: /code|data/i },
  { url: 'https://textbook-ing.vercel.app/api/textbooks?page=1&pageSize=5', name: '教材列表 API', expect: /code|data/i },
];

async function main() {
  log('连接 Edge...');
  const resp = await fetch('http://localhost:9222/json/version');
  const version = await resp.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: version.webSocketDebuggerUrl });

  const results = [];
  
  for (const item of URLs) {
    const page = await browser.newPage();
    try {
      log(`\n测试 ${item.name}: ${item.url}`);
      const res = await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = res ? res.status() : 0;
      const finalUrl = page.url();
      const content = await page.content();
      const text = await page.evaluate(() => document.body ? document.body.innerText : document.documentElement.textContent);
      
      log(`  状态: ${status}`);
      log(`  最终 URL: ${finalUrl}`);
      log(`  内容长度: ${text.length}`);
      log(`  内容预览: ${text.slice(0, 200).replace(/\s+/g, ' ')}`);
      
      const passed = status === 200 && item.expect.test(text);
      results.push({ name: item.name, url: item.url, status, passed, preview: text.slice(0, 100) });
      log(`  ${passed ? '✓ 通过' : '✗ 失败'}`);
    } catch (e) {
      log(`  异常: ${e.message}`);
      results.push({ name: item.name, url: item.url, status: 0, passed: false, error: e.message });
    }
    await page.close();
  }

  // 测试登录 API
  log('\n测试登录 API:');
  const loginPage = await browser.newPage();
  try {
    const loginResult = await loginPage.evaluate(async () => {
      try {
        const res = await fetch('https://textbook-ing.vercel.app/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@textbook-ing.com',
            password: 'admin123',
          }),
        });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 200) }; }
        return { status: res.status, data };
      } catch (e) {
        return { error: e.message };
      }
    });
    log(`  登录响应: ${JSON.stringify(loginResult).slice(0, 300)}`);
    const passed = loginResult.status === 200 && loginResult.data && (loginResult.data.code === 0 || loginResult.data.token);
    results.push({ name: '管理员登录', status: loginResult.status, passed, preview: JSON.stringify(loginResult.data).slice(0, 100) });
    log(`  ${passed ? '✓ 通过' : '✗ 失败'}`);
  } catch (e) {
    log(`  异常: ${e.message}`);
  }
  await loginPage.close();

  // 汇总
  console.log('\n========================================');
  console.log('部署验证结果');
  console.log('========================================');
  results.forEach(r => {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}: ${r.status} ${r.preview || r.error || ''}`.slice(0, 120));
  });
  
  const passed = results.filter(r => r.passed).length;
  console.log(`\n通过: ${passed}/${results.length}`);

  // 保存验证结果
  const creds = JSON.parse(fs.readFileSync('.deploy-creds.json', 'utf8'));
  creds.verification = {
    time: new Date().toISOString(),
    results,
    passed: passed + '/' + results.length,
    productionUrl: 'https://textbook-ing.vercel.app',
  };
  fs.writeFileSync('.deploy-creds.json', JSON.stringify(creds, null, 2), 'utf8');

  browser.disconnect();
  return results;
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
