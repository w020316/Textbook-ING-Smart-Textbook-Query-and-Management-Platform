/**
 * v8: 修正 bearerToken 提取并写入凭据
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const log = (msg) => console.log(`[v8] ${msg}`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  log('连接 Edge...');
  const resp = await fetch('http://localhost:9222/json/version');
  const version = await resp.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: version.webSocketDebuggerUrl });

  const page = await browser.newPage();
  try {
    await page.goto('https://vercel.com/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(2000);

    // 列出现有 token，避免重复创建
    const listResult = await page.evaluate(async () => {
      const res = await fetch('/api/v3/user/tokens', { credentials: 'include' });
      const text = await res.text();
      try { return { status: res.status, data: JSON.parse(text) }; }
      catch { return { status: res.status, raw: text.slice(0, 500) }; }
    });
    log(`现有 tokens 列表: ${JSON.stringify(listResult).slice(0, 400)}`);

    // 创建新 token（取 bearerToken 字段，不是 token 字段）
    const createResult = await page.evaluate(async () => {
      const res = await fetch('/api/v3/user/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: 'textbook-ing-deploy-v2' }),
      });
      const text = await res.text();
      try { return { status: res.status, data: JSON.parse(text) }; }
      catch { return { status: res.status, raw: text.slice(0, 500) }; }
    });
    log(`创建 token: ${JSON.stringify(createResult).slice(0, 400)}`);

    let bearerToken = null;
    if (createResult.status === 200 && createResult.data) {
      const data = createResult.data;
      if (typeof data.bearerToken === 'string') {
        bearerToken = data.bearerToken;
      } else if (data.token && typeof data.token === 'object') {
        // Vercel API 返回的 token.prefix + ... + token.suffix 组成 bearerToken
        // 但完整的 bearerToken 应该在 data.bearerToken 字段
        // 兜底从字符串里提取
        const m = JSON.stringify(data).match(/"(vcp_[A-Za-z0-9_]{30,})"/);
        if (m) bearerToken = m[1];
      }
    }
    
    if (!bearerToken) {
      // 兜底：正则提取 vcp_xxx 这种格式
      const m = JSON.stringify(createResult).match(/"(vcp_[A-Za-z0-9_]{30,})"/);
      if (m) bearerToken = m[1];
    }
    
    log(`bearerToken: ${bearerToken ? bearerToken.slice(0, 25) + '...' : '未获取'}`);

    if (bearerToken) {
      let existing = {};
      try { existing = JSON.parse(fs.readFileSync('.deploy-creds.json', 'utf8')); } catch {}
      existing.vercelToken = bearerToken;
      fs.writeFileSync('.deploy-creds.json', JSON.stringify(existing, null, 2), 'utf8');
      log('✓ 已保存 Vercel Token');
      console.log('\n========================================');
      console.log('最终凭据:');
      console.log('========================================');
      console.log(`Vercel Token: ${existing.vercelToken ? existing.vercelToken.slice(0, 25) + '...' : '未获取'}`);
      console.log(`Neon API Key: ${existing.neonApiKey ? existing.neonApiKey.slice(0, 25) + '...' : '未获取'}`);
    }
  } catch (e) {
    log(`异常: ${e.message}`);
  }
  await page.close();
  browser.disconnect();
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
