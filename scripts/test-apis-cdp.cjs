/**
 * 在浏览器中直接打开生产环境页面并测试所有 API
 */
const http = require('http')
const WebSocket = require('ws')

const CDP_BASE = 'http://localhost:9222'

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { resolve(data) }
      })
    }).on('error', reject)
  })
}

function evaluateJS(wsUrl, expression, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression, returnByValue: true, awaitPromise: true, userGesture: true },
      }))
    })
    ws.on('message', (msg) => {
      const data = JSON.parse(msg.toString())
      if (data.id === 1) {
        ws.close()
        if (data.error) reject(new Error(JSON.stringify(data.error)))
        else resolve(data.result?.result?.value)
      }
    })
    ws.on('error', reject)
    setTimeout(() => { ws.close(); reject(new Error('timeout')) }, timeout)
  })
}

async function main() {
  console.log('[1] Get browser tabs...')
  let tabs = await httpGet(`${CDP_BASE}/json`)

  // 优先选择已经在 textbook-ing 的 tab；否则用 newtab
  let tab = tabs.find(t => t.url && t.url.includes('textbook-ing.vercel.app'))
  if (!tab) tab = tabs.find(t => t.url && (t.url.includes('edge://newtab') || t.url === 'about:blank'))
  if (!tab) tab = tabs.find(t => t.type === 'page' && !t.url.includes('appleid.apple.com') && !t.url.includes('accounts.google.com') && !t.url.includes('x.com'))
  if (!tab) {
    console.error('No usable tab. Available:')
    for (const t of tabs) console.log(`  ${t.url}`)
    process.exit(1)
  }

  console.log(`[2] Using tab: ${tab.url}`)

  // 导航到生产环境
  console.log('[3] Navigating to https://textbook-ing.vercel.app/?_t=' + Date.now() + ' ...')

  await new Promise((resolve, reject) => {
    const ws = new WebSocket(tab.webSocketDebuggerUrl)
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Page.navigate',
        params: { url: 'https://textbook-ing.vercel.app/?_t=' + Date.now() },
      }))
    })
    ws.on('message', (msg) => {
      const data = JSON.parse(msg.toString())
      if (data.id === 1) {
        ws.close()
        resolve(data)
      }
    })
    ws.on('error', reject)
    setTimeout(() => { ws.close(); reject(new Error('navigate timeout')) }, 30000)
  })

  // 等待页面加载
  console.log('[4] Waiting for page load...')
  await new Promise(r => setTimeout(r, 12000))

  // 重新获取 tab
  tabs = await httpGet(`${CDP_BASE}/json`)
  tab = tabs.find(t => t.url && t.url.includes('textbook-ing.vercel.app'))
  if (!tab) {
    console.error('Tab not found after navigation')
    for (const t of tabs) console.log(`  ${t.url}`)
    process.exit(1)
  }

  console.log(`[5] Tab URL now: ${tab.url}`)

  // 测试 API + 检查登录按钮
  console.log('[6] Testing APIs and login button...')

  const result = await evaluateJS(
    tab.webSocketDebuggerUrl,
    `(async () => {
      const results = {};
      const apis = [
        { name: 'news', url: '/api/news?pageSize=3' },
        { name: 'newsCategories', url: '/api/news/categories' },
        { name: 'stats', url: '/api/stats' },
        { name: 'semesters', url: '/api/semesters' },
      ];
      for (const api of apis) {
        try {
          const resp = await fetch(api.url);
          const text = await resp.text();
          results[api.name] = {
            status: resp.status,
            bodyPreview: text.substring(0, 300),
            bodyLength: text.length
          };
        } catch(e) {
          results[api.name] = { error: e.message };
        }
      }
      // 检查登录按钮
      const loginBtn = document.querySelector('a[href="/login"]');
      results.loginButton = loginBtn ? { exists: true, text: loginBtn.textContent.trim(), visible: loginBtn.offsetParent !== null } : { exists: false };
      // 检查管理员入口
      const adminLink = document.querySelector('a[href="/admin/login"]');
      results.adminLink = adminLink ? { exists: true, visible: adminLink.offsetParent !== null } : { exists: false };
      return JSON.stringify(results, null, 2);
    })()`,
    60000
  )

  console.log('\n=== Test Results ===')
  try {
    const parsed = JSON.parse(result)
    for (const [name, info] of Object.entries(parsed)) {
      console.log(`\n--- ${name} ---`)
      if (info.error) {
        console.log(`  ERROR: ${info.error}`)
      } else if (info.exists !== undefined) {
        console.log(`  Exists: ${info.exists}, Visible: ${info.visible}, Text: ${info.text || ''}`)
      } else {
        console.log(`  Status: ${info.status}`)
        console.log(`  Length: ${info.bodyLength}`)
        console.log(`  Preview: ${info.bodyPreview}`)
      }
    }
  } catch {
    console.log(result)
  }
}

main().catch(e => {
  console.error('Failed:', e.message)
  process.exit(1)
})
