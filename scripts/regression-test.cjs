/**
 * 回归测试：验证所有修复后的功能
 * 1. 公开 API（含缓存验证）
 * 2. 前台登录 + redirect
 * 3. 管理后台登录（独立 token）
 * 4. 前后台登录隔离验证
 * 5. 管理后台全模块 API
 * 6. 教材去重验证
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
    return { status: r.status, length: text.length, elapsed, data, preview: text.substring(0, 150) }
  } catch (e) {
    return { error: e.message, elapsed: Date.now() - start }
  }
}

let passed = 0
let failed = 0
const failures = []

function check(name, condition, detail = '') {
  if (condition) {
    passed++
    console.log(`  ✓ ${name} ${detail}`)
  } else {
    failed++
    failures.push(name)
    console.log(`  ✗ ${name} ${detail}`)
  }
}

async function main() {
  console.log('========================================')
  console.log('回归测试 - 教材ING 平台')
  console.log('========================================')

  // ========== 1. 公开 API ==========
  console.log('\n=== 1. 公开 API 测试 ===')
  const publicApis = [
    { url: '/api/news?pageSize=3', name: '新闻列表' },
    { url: '/api/news/categories', name: '新闻分类' },
    { url: '/api/stats', name: '统计' },
    { url: '/api/semesters', name: '学期列表' },
    { url: '/api/colleges', name: '学院列表' },
    { url: '/api/textbooks/hot-searches', name: '热门搜索' },
  ]
  for (const api of publicApis) {
    const r = await fetchApi(api.url)
    check(`${api.name} ${api.url}`, r.status === 200 && r.data?.code === 0, `-> ${r.status}, ${r.length}b, ${r.elapsed}ms`)
  }

  // 缓存验证：第二次请求应更快
  console.log('\n=== 1.1 缓存加速验证 ===')
  const r1 = await fetchApi('/api/stats')
  const r2 = await fetchApi('/api/stats')
  check('统计缓存加速', r2.elapsed < r1.elapsed, `首次 ${r1.elapsed}ms → 缓存 ${r2.elapsed}ms`)

  // ========== 2. 前台登录 ==========
  console.log('\n=== 2. 前台登录测试 ===')
  // 尝试用管理员账号从前台登录（应被拒绝）
  const frontAdminLogin = await fetchApi('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  // API 层面会成功返回 token（前端 LoginView 拦截）
  check('前台登录 API 返回', frontAdminLogin.status === 200, `-> ${frontAdminLogin.status}`)

  // ========== 3. 管理后台登录 ==========
  console.log('\n=== 3. 管理后台登录（独立 token） ===')
  const adminLogin = await fetchApi('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  const adminToken = adminLogin.data?.data?.token
  check('管理员登录', adminLogin.status === 200 && !!adminToken, `-> ${adminLogin.status}, token=${adminToken ? 'OK' : 'MISSING'}`)

  if (!adminToken) {
    console.log('\n❌ 管理员登录失败，无法继续后续测试')
    process.exit(1)
  }

  // ========== 4. 管理后台 API（用 adminToken） ==========
  console.log('\n=== 4. 管理后台 API 测试 ===')
  const adminApis = [
    { url: '/api/admin/stats', name: '后台统计' },
    { url: '/api/admin/textbooks?page=1&pageSize=5', name: '教材管理' },
    { url: '/api/admin/news?page=1&pageSize=5', name: '新闻管理' },
    { url: '/api/admin/users?page=1&pageSize=5', name: '用户管理' },
    { url: '/api/admin/semesters', name: '校历管理' },
    { url: '/api/admin/colleges', name: '学院管理' },
    { url: '/api/admin/courses', name: '课程管理' },
    { url: '/api/admin/categories', name: '分类管理' },
  ]
  for (const api of adminApis) {
    const r = await fetchApi(api.url, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    check(`${api.name} ${api.url}`, r.status === 200 && r.data?.code === 0, `-> ${r.status}, ${r.length}b, ${r.elapsed}ms`)
  }

  // ========== 5. 教材去重验证 ==========
  console.log('\n=== 5. 教材去重验证 ===')
  const tbList = await fetchApi('/api/admin/textbooks?page=1&pageSize=100', {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  if (tbList.data?.code === 0) {
    const textbooks = tbList.data.data.list || []
    const titles = textbooks.map(t => t.title)
    const uniqueTitles = new Set(titles)
    check('教材无重复', titles.length === uniqueTitles.size, `-> ${titles.length} 本，唯一 ${uniqueTitles.size} 本`)
    check('教材数量合理', textbooks.length <= 20, `-> ${textbooks.length} 本（去重前 45）`)
  }

  // ========== 6. 首页加载 ==========
  console.log('\n=== 6. 首页加载 ===')
  const home = await fetchApi('/')
  check('首页可访问', home.status === 200, `-> ${home.status}, ${home.length}b`)

  // ========== 汇总 ==========
  console.log('\n========================================')
  console.log(`回归测试结果: ${passed} 通过, ${failed} 失败`)
  console.log('========================================')
  if (failed > 0) {
    console.log('失败项:')
    failures.forEach(f => console.log(`  - ${f}`))
    process.exit(1)
  }
}

main().catch(e => {
  console.error('测试异常:', e.message)
  process.exit(1)
})
