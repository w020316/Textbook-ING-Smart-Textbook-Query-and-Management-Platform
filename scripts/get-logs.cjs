/**
 * 获取 Vercel 部署的运行时日志（最新函数调用错误）
 */
const fs = require('fs')
const path = require('path')

async function main() {
  const token = fs.readFileSync(path.join(__dirname, '.vercel-token-clean'), 'utf8').trim()
  const teamId = 'team_pdaobxPxJ2Bm369qHJh0WWQc'
  const depId = 'dpl_SZo4Q7NgGZjJHdE99czFrUHRppVQ'

  console.log('Fetching deployment events...')

  // 1. 获取部署构建日志
  try {
    const resp = await fetch(`https://api.vercel.com/v3/deployments/${depId}/events?teamId=${teamId}&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await resp.json()
    console.log(`Status: ${resp.status}, events: ${data.length || 0}`)

    if (Array.isArray(data)) {
      // 筛选错误相关
      const errors = data.filter(e =>
        e.type === 'error' ||
        e.type === 'warning' ||
        (e.message && (e.message.toLowerCase().includes('error') || e.message.toLowerCase().includes('fail')))
      )
      console.log(`\n=== Errors/Warnings (${errors.length}) ===`)
      for (const e of errors.slice(0, 30)) {
        console.log(`[${e.type}] ${e.message}`)
      }

      // 显示所有 stderr
      const stderr = data.filter(e => e.type === 'stderr')
      console.log(`\n=== stderr (${stderr.length}) ===`)
      for (const e of stderr.slice(0, 30)) {
        console.log(`[stderr] ${e.message}`)
      }

      // 显示所有 stdout（可能有 console.log）
      const stdout = data.filter(e => e.type === 'stdout' && e.message && e.message.trim())
      console.log(`\n=== stdout (non-empty, ${stdout.length}) ===`)
      for (const e of stdout.slice(0, 30)) {
        console.log(`[stdout] ${e.message}`)
      }
    }
  } catch (e) {
    console.error('Failed to fetch events:', e.message)
  }

  // 2. 获取最新运行时日志
  console.log('\n=== Fetching runtime logs ===')
  try {
    const resp = await fetch(`https://api.vercel.com/v3/deployments/${depId}/runtime-logs?teamId=${teamId}&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await resp.json()
    console.log(`Status: ${resp.status}, logs: ${data.logs?.length || 0}`)

    if (data.logs) {
      for (const log of data.logs.slice(0, 30)) {
        console.log(`[${log.level || log.type}] ${log.message || JSON.stringify(log).substring(0, 300)}`)
      }
    }
  } catch (e) {
    console.error('Failed to fetch runtime logs:', e.message)
  }
}

main().catch(e => {
  console.error('Failed:', e.message)
  process.exit(1)
})
