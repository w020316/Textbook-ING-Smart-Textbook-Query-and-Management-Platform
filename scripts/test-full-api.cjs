/**
 * 全功能 API 测试
 * 凭据通过环境变量注入：TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
 */
const BASE = 'https://textbook-ing.vercel.app'
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@textbook-ing.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123'

async function fetchApi(path, options = {}) {
  const start = Date.now()
  try {
    const r = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    })
    const text = await r.text()
    const elapsed = Date.now() - start
    let data = null
    try { data = JSON.parse(text) } catch {}
    return { status: r.status, length: text.length, elapsed, data, preview: text.substring(0, 100) }
  } catch (e) {
    return { error: e.message, elapsed: Date.now() - start }
  }
}

async function main() {
  console.log('=== 1. 公开 API 测试 ===')
  const publicApis = [
    '/api/news?pageSize=3',
    '/api/news/categories',
    '/api/stats',
    '/api/semesters',
    '/api/calendar',
  ]
  for (const api of publicApis) {
    const r = await fetchApi(api)
    if (r.error) {
      console.log(`  ERR ${api} -> ${r.error}`)
    } else {
      console.log(`  ${r.status === 200 ? 'OK ' : 'ERR'} ${api} -> ${r.status}, ${r.length}b, ${r.elapsed}ms`)
    }
  }

  console.log(`\n=== 2. 登录测试 (${ADMIN_EMAIL}) ===`)
  const loginR = await fetchApi('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (loginR.error || loginR.status !== 200) {
    console.log(`  Login failed: ${loginR.error || loginR.status} ${loginR.preview}`)
    return
  }
  const token = loginR.data?.data?.token
  const user = loginR.data?.data?.user
  console.log(`  OK Login -> ${loginR.status}, ${loginR.elapsed}ms`)
  console.log(`  User: ${user?.email}, role=${user?.role}`)
  console.log(`  Token: ${token?.substring(0, 20)}...`)
  if (!token) { console.log('  No token!'); return }

  const authHeaders = { Authorization: `Bearer ${token}` }

  console.log('\n=== 3. 认证 API 测试 ===')
  const authApis = [
    '/api/auth/me',
    '/api/textbooks?page=1&pageSize=3',
    '/api/textbooks/hot-searches',
    '/api/colleges',
    '/api/points/balance',
    '/api/points/records',
    '/api/messages',
    '/api/messages/unread',
  ]
  for (const api of authApis) {
    const r = await fetchApi(api, { headers: authHeaders })
    if (r.error) {
      console.log(`  ERR ${api} -> ${r.error}`)
    } else {
      console.log(`  ${r.status === 200 ? 'OK ' : 'ERR'} ${api} -> ${r.status}, ${r.length}b, ${r.elapsed}ms`)
    }
  }

  console.log('\n=== 4. 管理后台 API 测试 ===')
  const adminApis = [
    '/api/admin/stats',
    '/api/admin/textbooks?page=1&pageSize=3',
    '/api/admin/news?page=1&pageSize=3',
    '/api/admin/users?page=1&pageSize=3',
    '/api/admin/semesters',
    '/api/admin/colleges',
    '/api/admin/courses',
    '/api/admin/categories',
  ]
  for (const api of adminApis) {
    const r = await fetchApi(api, { headers: authHeaders })
    if (r.error) {
      console.log(`  ERR ${api} -> ${r.error}`)
    } else {
      console.log(`  ${r.status === 200 ? 'OK ' : 'ERR'} ${api} -> ${r.status}, ${r.length}b, ${r.elapsed}ms`)
    }
  }

  console.log('\n=== 5. 首页加载测试 ===')
  const homeR = await fetchApi('/')
  if (homeR.error) {
    console.log(`  Homepage error: ${homeR.error}`)
  } else {
    console.log(`  Homepage: ${homeR.status}, ${homeR.length}b, ${homeR.elapsed}ms`)
    console.log(`  Contains "登录": ${homeR.preview.includes('登录') || homeR.data?.toString().includes('登录')}`)
  }

  console.log('\n=== 测试完成 ===')
}

main().catch(e => console.error('Failed:', e.message))
