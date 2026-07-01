/**
 * 调试 API：直接在浏览器中访问 API URL，看完整响应
 */
const puppeteer = require('puppeteer-core');

const log = (msg) => console.log(`[debug] ${msg}`);

async function main() {
  const resp = await fetch('http://localhost:9222/json/version');
  const version = await resp.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: version.webSocketDebuggerUrl });

  const tests = [
    'https://textbook-ing.vercel.app/api/semesters',
    'https://textbook-ing.vercel.app/api/news/categories',
    'https://textbook-ing.vercel.app/api/auth/me',
  ];

  for (const url of tests) {
    const page = await browser.newPage();
    try {
      log(`\n访问: ${url}`);
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      log(`  状态: ${res ? res.status() : 'N/A'}`);
      const text = await page.evaluate(() => document.body ? document.body.innerText : document.documentElement.textContent || '');
      log(`  内容: ${text.slice(0, 500)}`);
    } catch (e) {
      log(`  异常: ${e.message}`);
    }
    await page.close();
  }

  browser.disconnect();
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
