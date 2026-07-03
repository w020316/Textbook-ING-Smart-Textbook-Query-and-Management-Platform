/**
 * 通过 CDP 在 Vercel 网站执行 fetch 获取运行时日志
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

function evaluateJS(wsUrl, expression) {
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
    setTimeout(() => { ws.close(); reject(new Error('timeout')) }, 60000)
  })
}

async function main() {
  console.log('[1] Get browser tabs...')
  const tabs = await httpGet(`${CDP_BASE}/json`)
  const vercelTab = tabs.find(t => t.url && t.url.includes('vercel.com'))

  if (!vercelTab) {
    console.error('No Vercel tab found. Open https://vercel.com/dashboard in Edge first')
    process.exit(1)
  }

  console.log(`[2] Found Vercel tab: ${vercelTab.url}`)

  // 在 Vercel 页面内执行 fetch（使用浏览器 credentials）
  const depId = 'dpl_SZo4Q7NgGZjJHdE99czFrUHRppVQ'
  const teamId = 'team_pdaobxPxJ2Bm369qHJh0WWQc'

  console.log('[3] Fetching runtime logs via browser...')

  const result = await evaluateJS(
    vercelTab.webSocketDebuggerUrl,
    `(async () => {
      try {
        const resp = await fetch('https://api.vercel.com/v6/deployments/${depId}/runtime-logs?teamId=${teamId}&limit=50', {
          credentials: 'include'
        });
        const data = await resp.json();
        const logs = data.logs || [];
        const filtered = logs.filter(l => l.message && l.message.trim());
        return JSON.stringify({
          status: resp.status,
          totalLogs: logs.length,
          filteredLogs: filtered.length,
          logs: filtered.slice(0, 30).map(l => ({ level: l.level, message: l.message.substring(0, 500) }))
        });
      } catch(e) {
        return JSON.stringify({ error: e.message });
      }
    })()`
  )

  console.log('\n=== Result ===')
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
    }
  } catch {
    console.log(result)
  }
}

main().catch(e => {
  console.error('Failed:', e.message)
  process.exit(1)
})
