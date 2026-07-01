/**
 * 用浏览器访问 Vercel inspect 页面查看日志
 */
const puppeteer = require('puppeteer-core');

const log = (msg) => console.log(`[log] ${msg}`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const resp = await fetch('http://localhost:9222/json/version');
  const version = await resp.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: version.webSocketDebuggerUrl });

  // 1. 先触发 API 请求
  log('触发 API 请求...');
  const apiPage = await browser.newPage();
  try {
    await apiPage.goto('https://textbook-ing.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const result = await apiPage.evaluate(async () => {
      try {
        const res = await fetch('/api/semesters');
        return { status: res.status, text: (await res.text()).slice(0, 200) };
      } catch (e) { return { error: e.message }; }
    });
    log(`API 结果: ${JSON.stringify(result)}`);
  } catch (e) {
    log(`异常: ${e.message}`);
  }
  await apiPage.close();

  // 2. 查看 Vercel inspect 页面的日志
  log('\n查看 Vercel inspect 页面...');
  const inspectPage = await browser.newPage();
  try {
    await inspectPage.goto('https://vercel.com/w020316s-projects/textbook-ing/J5yPWPCJVSz7rv8bcohLv8uDbcdN/logs', { 
      waitUntil: 'networkidle0', timeout: 30000 
    });
    await sleep(3000);
    const text = await inspectPage.evaluate(() => document.body ? document.body.innerText : '');
    log(`inspect 页面内容（前 2000 字符）:`);
    console.log(text.slice(0, 2000));
  } catch (e) {
    log(`异常: ${e.message}`);
  }
  await inspectPage.close();

  browser.disconnect();
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
