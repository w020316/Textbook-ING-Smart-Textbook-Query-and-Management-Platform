/**
 * 通过 CDP 在 Vercel 部署的 inspector 页面获取运行时日志
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

  // 使用已登录 Vercel 的 tab 或第一个 page tab
  let tab = tabs.find(t => t.url && t.url.includes('vercel.com'))
  if (!tab) tab = tabs.find(t => t.type === 'page')
  if (!tab) {
    console.error('No tab available')
    process.exit(1)
  }

  console.log(`[2] Using tab: ${tab.url}`)

  // 导航到部署 inspector 页面
  const inspectorUrl = 'https://vercel.com/w020316s-projects/textbook-ing/SZo4Q7NgGZjJHdE99czFrUHRppVQ'
  console.log(`[3] Navigating to inspector: ${inspectorUrl}`)

  await new Promise((resolve, reject) => {
    const ws = new WebSocket(tab.webSocketDebuggerUrl)
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Page.navigate',
        params: { url: inspectorUrl },
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

  console.log('[4] Waiting for inspector page load...')
  await new Promise(r => setTimeout(r, 12000))

  // 重新获取 tab
  tabs = await httpGet(`${CDP_BASE}/json`)
  tab = tabs.find(t => t.url && t.url.includes('SZo4Q7NgGZjJHdE99czFrUHRppVQ'))
  if (!tab) {
    console.log('Inspector tab not found, available tabs:')
    for (const t of tabs) console.log(`  ${t.url}`)
    // 尝试用已有 vercel tab 调用 API
    tab = tabs.find(t => t.url && t.url.includes('vercel.com'))
  }

  if (!tab) {
    console.error('No usable tab')
    process.exit(1)
  }

  console.log(`[5] Tab URL: ${tab.url}`)

  // 通过浏览器 fetch 获取 runtime logs API
  console.log('[6] Fetching runtime logs via Vercel API...')

  const result = await evaluateJS(
    tab.webSocketDebuggerUrl,
    `(async () => {
      try {
        // 通过浏览器 fetch（带 credentials）调用 Vercel runtime logs API
        const depId = 'dpl_SZo4Q7NgGZjJHdE99czFrUHRppVQ'
        const teamId = 'team_pdaobxPxJ2Bm369qHJh0WWQc'
        const url = 'https://api.vercel.com/v6/deployments/' + depId + '/runtime-logs?teamId=' + teamId + '&limit=100'
        const resp = await fetch(url, { credentials: 'include' })
        const data = await resp.json()
        const logs = data.logs || []
        // 只显示有内容的日志
        const filtered = logs.filter(l => l.message && l.message.trim())
        return JSON.stringify({
          status: resp.status,
          totalLogs: logs.length,
          filteredLogs: filtered.length,
          logs: filtered.slice(-50).map(l => ({
            level: l.level || l.type,
            message: l.message.substring(0, 500),
            created: l.created || l.timestamp
          }))
        })
      } catch(e) {
        return JSON.stringify({ error: e.message, stack: e.stack })
      }
    })()`,
    60000
  )

  console.log('\n=== Runtime Logs ===')
  try {
    const parsed = JSON.parse(result)
    console.log(`Status: ${parsed.status}, Total: ${parsed.totalLogs}, Filtered: ${parsed.filteredLogs}`)
    if (parsed.logs) {
      for (const log of parsed.logs) {
        console.log(`[${log.level}] ${log.message}`)
      }
    }
    if (parsed.error) {
      console.log(`Error: ${parsed.error}`)
      if (parsed.stack) console.log(`Stack: ${parsed.stack}`)
    }
  } catch {
    console.log(result)
  }
}

main().catch(e => {
  console.error('Failed:', e.message)
  process.exit(1)
})
