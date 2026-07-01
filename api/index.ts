// 教材ING API 主路由 - Catch-all Handler
import { prisma, hashPassword, comparePassword, signToken, getUserFromRequest, requireAuth, sendSuccess, sendError, generateCode, getRequestBody } from './_lib.js'

// ==================== 路由匹配 ====================
type Handler = (req: any, res: any, params: Record<string, string>, query: URLSearchParams) => Promise<void>

interface Route {
  method: string
  pattern: string
  handler: Handler
  auth?: boolean
}

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const pParts = pattern.split('/').filter(Boolean)
  const aParts = path.split('/').filter(Boolean)
  if (pParts.length !== aParts.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(':')) {
      params[pParts[i].substring(1)] = decodeURIComponent(aParts[i])
    } else if (pParts[i] !== aParts[i]) {
      return null
    }
  }
  return params
}

// ==================== 路由定义 ====================
const routes: Route[] = [
  // --- 认证 ---
  { method: 'POST', pattern: '/api/auth/send-code', handler: handleSendCode },
  { method: 'POST', pattern: '/api/auth/register', handler: handleRegister },
  { method: 'POST', pattern: '/api/auth/login', handler: handleLogin },
  { method: 'POST', pattern: '/api/auth/forgot-password', handler: handleForgotPassword },
  { method: 'POST', pattern: '/api/auth/reset-password', handler: handleResetPassword },
  { method: 'GET', pattern: '/api/auth/me', handler: handleMe, auth: true },

  // --- 教材 ---
  { method: 'GET', pattern: '/api/textbooks', handler: handleTextbookList, auth: true },
  { method: 'GET', pattern: '/api/textbooks/hot-searches', handler: handleHotSearches, auth: true },
  { method: 'GET', pattern: '/api/textbooks/:id', handler: handleTextbookDetail, auth: true },

  // --- 学院/专业/班级 ---
  { method: 'GET', pattern: '/api/colleges', handler: handleColleges, auth: true },
  { method: 'GET', pattern: '/api/colleges/:id/majors', handler: handleMajors, auth: true },
  { method: 'GET', pattern: '/api/majors/:id/classes', handler: handleClasses, auth: true },

  // --- 校历 ---
  { method: 'GET', pattern: '/api/semesters', handler: handleSemesters },
  { method: 'GET', pattern: '/api/calendar', handler: handleCalendar },

  // --- 新闻 ---
  { method: 'GET', pattern: '/api/news/categories', handler: handleNewsCategories },
  { method: 'GET', pattern: '/api/news', handler: handleNewsList },
  { method: 'GET', pattern: '/api/news/:id', handler: handleNewsDetail },
  { method: 'GET', pattern: '/api/news/:id/comments', handler: handleNewsComments },
  { method: 'POST', pattern: '/api/news/:id/comments', handler: handleAddComment, auth: true },

  // --- 统计 ---
  { method: 'GET', pattern: '/api/stats', handler: handleStats },

  // --- 积分 ---
  { method: 'GET', pattern: '/api/points/balance', handler: handlePointsBalance, auth: true },
  { method: 'GET', pattern: '/api/points/records', handler: handlePointsRecords, auth: true },

  // --- 消息 ---
  { method: 'GET', pattern: '/api/messages', handler: handleMessages, auth: true },
  { method: 'GET', pattern: '/api/messages/unread', handler: handleUnreadMessages, auth: true },
  { method: 'PUT', pattern: '/api/messages/:id/read', handler: handleMarkRead, auth: true },
]

// ==================== 主处理器 ====================
export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
  const path = url.pathname
  const query = url.searchParams
  const method = req.method || 'GET'

  for (const route of routes) {
    if (route.method !== method) continue
    const params = matchRoute(route.pattern, path)
    if (params) {
      try {
        if (route.auth) {
          const user = await getUserFromRequest(req)
          if (!user) return sendError(res, '未认证，请先登录', 2, 401)
          ;(req as any)._user = user
        }
        await route.handler(req, res, params, query)
        return
      } catch (err: any) {
        console.error(`[API Error] ${method} ${path}:`, err)
        return sendError(res, err.message || '服务器内部错误', 5, 500)
      }
    }
  }

  return sendError(res, '接口不存在', 4, 404)
}

// ==================== 认证处理器 ====================

async function handleSendCode(req: any, res: any, params: any, query: URLSearchParams) {
  const body = await getRequestBody(req)
  const email = body.email?.trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, '邮箱格式不正确')
  }

  // 检查是否已注册（注册场景）
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing && !query.get('type')) {
    return sendError(res, '该邮箱已注册')
  }

  // 生成验证码
  const code = generateCode()

  // 清理旧验证码，创建新的
  await prisma.verifyToken.deleteMany({ where: { email, type: 'REGISTER' } })
  await prisma.verifyToken.create({
    data: {
      email,
      code,
      type: 'REGISTER',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  // 开发环境返回验证码，生产环境应发送邮件
  const isDev = process.env.NODE_ENV !== 'production'
  return sendSuccess(res, isDev ? { code } : null, '验证码已发送')
}

async function handleRegister(req: any, res: any) {
  const body = await getRequestBody(req)
  const { email, password, code, name } = body

  if (!email || !password || !code) {
    return sendError(res, '请填写完整信息')
  }
  if (password.length < 6) {
    return sendError(res, '密码长度至少6位')
  }

  // 验证码校验
  const token = await prisma.verifyToken.findFirst({
    where: { email, code, type: 'REGISTER', used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!token) {
    return sendError(res, '验证码错误或已过期')
  }

  // 检查邮箱
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return sendError(res, '该邮箱已注册')
  }

  // 创建用户
  const hashedPassword = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      points: 100,
      emailVerified: new Date(),
    },
  })

  // 赠送积分记录
  await prisma.pointRecord.create({
    data: { userId: user.id, amount: 100, reason: '注册赠送', balance: 100 },
  })

  // 标记验证码已使用
  await prisma.verifyToken.update({ where: { id: token.id }, data: { used: true } })

  // 生成 JWT
  const jwtToken = signToken(user.id)

  return sendSuccess(res, {
    token: jwtToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, points: user.points },
  }, '注册成功')
}

async function handleLogin(req: any, res: any) {
  const body = await getRequestBody(req)
  const { email, password } = body

  if (!email || !password) {
    return sendError(res, '请输入邮箱和密码')
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return sendError(res, '邮箱或密码错误')
  }

  const valid = await comparePassword(password, user.password)
  if (!valid) {
    return sendError(res, '邮箱或密码错误')
  }

  const jwtToken = signToken(user.id)

  return sendSuccess(res, {
    token: jwtToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, points: user.points },
  }, '登录成功')
}

async function handleForgotPassword(req: any, res: any) {
  const body = await getRequestBody(req)
  const email = body.email?.trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, '邮箱格式不正确')
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return sendError(res, '该邮箱未注册')
  }

  const code = generateCode()
  await prisma.verifyToken.deleteMany({ where: { email, type: 'RESET' } })
  await prisma.verifyToken.create({
    data: { email, code, type: 'RESET', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  })

  const isDev = process.env.NODE_ENV !== 'production'
  return sendSuccess(res, isDev ? { code } : null, '重置验证码已发送')
}

async function handleResetPassword(req: any, res: any) {
  const body = await getRequestBody(req)
  const { email, code, newPassword } = body

  if (!email || !code || !newPassword) {
    return sendError(res, '请填写完整信息')
  }
  if (newPassword.length < 6) {
    return sendError(res, '密码长度至少6位')
  }

  const token = await prisma.verifyToken.findFirst({
    where: { email, code, type: 'RESET', used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!token) {
    return sendError(res, '验证码错误或已过期')
  }

  const hashedPassword = await hashPassword(newPassword)
  await prisma.user.update({ where: { email }, data: { password: hashedPassword } })
  await prisma.verifyToken.update({ where: { id: token.id }, data: { used: true } })

  return sendSuccess(res, null, '密码重置成功')
}

async function handleMe(req: any, res: any) {
  const user = (req as any)._user
  return sendSuccess(res, user)
}

// ==================== 教材处理器 ====================

async function handleTextbookList(req: any, res: any, params: any, query: URLSearchParams) {
  const page = parseInt(query.get('page') || '1')
  const pageSize = parseInt(query.get('pageSize') || '20')
  const keyword = query.get('keyword') || ''
  const collegeId = query.get('collegeId') || ''
  const majorId = query.get('majorId') || ''
  const classId = query.get('classId') || ''
  const semesterId = query.get('semesterId') || ''

  const where: any = {}
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { author: { contains: keyword, mode: 'insensitive' } },
      { publisher: { contains: keyword, mode: 'insensitive' } },
    ]
  }
  if (classId) where.classId = classId
  if (majorId) where.class = { majorId }
  if (collegeId) where.class = { major: { collegeId } }
  if (semesterId) where.course = { semesterId }

  const [total, list] = await Promise.all([
    prisma.textbook.count({ where }),
    prisma.textbook.findMany({
      where,
      include: { course: { include: { semester: true } }, class: { include: { major: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { title: 'asc' },
    }),
  ])

  // 记录热门搜索
  if (keyword) {
    const existing = await prisma.hotSearch.findFirst({ where: { keyword } }).catch(() => null)
    if (existing) {
      await prisma.hotSearch.update({ where: { id: existing.id }, data: { count: { increment: 1 } } }).catch(() => {})
    } else {
      await prisma.hotSearch.create({ data: { keyword, count: 1 } }).catch(() => {})
    }
  }

  return sendSuccess(res, {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

async function handleTextbookDetail(req: any, res: any, params: any) {
  const { id } = params
  const textbook = await prisma.textbook.findUnique({
    where: { id },
    include: { course: { include: { semester: true } }, class: { include: { major: { include: { college: true } } } } },
  })
  if (!textbook) return sendError(res, '教材不存在', 4, 404)
  return sendSuccess(res, textbook)
}

async function handleHotSearches(req: any, res: any) {
  const list = await prisma.hotSearch.findMany({
    orderBy: { count: 'desc' },
    take: 10,
  })
  return sendSuccess(res, list)
}

// ==================== 学院/专业/班级 ====================

async function handleColleges(req: any, res: any) {
  const list = await prisma.college.findMany({
    orderBy: { sort: 'asc' },
    include: { _count: { select: { majors: true } } },
  })
  return sendSuccess(res, list)
}

async function handleMajors(req: any, res: any, params: any) {
  const { id } = params
  const list = await prisma.major.findMany({
    where: { collegeId: id },
    orderBy: { sort: 'asc' },
    include: { _count: { select: { classes: true } } },
  })
  return sendSuccess(res, list)
}

async function handleClasses(req: any, res: any, params: any) {
  const { id } = params
  const list = await prisma.class.findMany({
    where: { majorId: id },
    orderBy: { grade: 'desc' },
  })
  return sendSuccess(res, list)
}

// ==================== 校历 ====================

async function handleSemesters(req: any, res: any) {
  const list = await prisma.semester.findMany({
    orderBy: { startDate: 'desc' },
  })
  return sendSuccess(res, list)
}

async function handleCalendar(req: any, res: any, params: any, query: URLSearchParams) {
  const semesterId = query.get('semesterId')
  if (!semesterId) return sendError(res, '请选择学期')

  const weeks = await prisma.calendarWeek.findMany({
    where: { semesterId },
    orderBy: { weekNumber: 'asc' },
  })
  return sendSuccess(res, weeks)
}

// ==================== 新闻 ====================

async function handleNewsCategories(req: any, res: any) {
  const list = await prisma.newsCategory.findMany({
    orderBy: { sort: 'asc' },
    include: { _count: { select: { news: true } } },
  })
  return sendSuccess(res, list)
}

async function handleNewsList(req: any, res: any, params: any, query: URLSearchParams) {
  const page = parseInt(query.get('page') || '1')
  const pageSize = parseInt(query.get('pageSize') || '10')
  const categoryId = query.get('categoryId') || ''

  const where: any = {}
  if (categoryId) where.categoryId = categoryId

  const [total, pinned, list] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({ where: { ...where, isPinned: true }, include: { category: true }, orderBy: { createdAt: 'desc' } }),
    prisma.news.findMany({
      where: { ...where, isPinned: false },
      include: { category: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return sendSuccess(res, {
    pinned,
    list,
    total: total - pinned.length,
    page,
    pageSize,
    totalPages: Math.ceil((total - pinned.length) / pageSize),
  })
}

async function handleNewsDetail(req: any, res: any, params: any) {
  const { id } = params
  const news = await prisma.news.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    include: { category: true, author: { select: { name: true, avatar: true } } },
  })
  if (!news) return sendError(res, '新闻不存在', 4, 404)

  // 相关文章
  const related = await prisma.news.findMany({
    where: { categoryId: news.categoryId, id: { not: id } },
    take: 4,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, createdAt: true, viewCount: true },
  })

  return sendSuccess(res, { ...news, related })
}

async function handleNewsComments(req: any, res: any, params: any, query: URLSearchParams) {
  const { id } = params
  const page = parseInt(query.get('page') || '1')
  const pageSize = parseInt(query.get('pageSize') || '20')

  const [total, list] = await Promise.all([
    prisma.comment.count({ where: { newsId: id } }),
    prisma.comment.findMany({
      where: { newsId: id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return sendSuccess(res, { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}

async function handleAddComment(req: any, res: any, params: any) {
  const { id } = params
  const user = (req as any)._user
  const body = await getRequestBody(req)
  const content = body.content?.trim()

  if (!content) return sendError(res, '评论内容不能为空')
  if (content.length > 500) return sendError(res, '评论内容不能超过500字')

  const news = await prisma.news.findUnique({ where: { id } })
  if (!news) return sendError(res, '新闻不存在', 4, 404)

  const comment = await prisma.comment.create({
    data: { content, userId: user.id, newsId: id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  })

  // 评论奖励积分
  await prisma.user.update({ where: { id: user.id }, data: { points: { increment: 2 } } })
  await prisma.pointRecord.create({
    data: { userId: user.id, amount: 2, reason: '评论奖励', balance: user.points + 2 },
  })

  return sendSuccess(res, comment, '评论成功')
}

// ==================== 统计 ====================

async function handleStats(req: any, res: any) {
  const [semesters, textbooks, users, colleges] = await Promise.all([
    prisma.semester.count(),
    prisma.textbook.count(),
    prisma.user.count(),
    prisma.college.count(),
  ])

  return sendSuccess(res, {
    semesterCount: semesters,
    textbookCount: textbooks,
    userCount: users,
    collegeCount: colleges,
  })
}

// ==================== 积分 ====================

async function handlePointsBalance(req: any, res: any) {
  const user = (req as any)._user
  return sendSuccess(res, { points: user.points })
}

async function handlePointsRecords(req: any, res: any, params: any, query: URLSearchParams) {
  const user = (req as any)._user
  const page = parseInt(query.get('page') || '1')
  const pageSize = parseInt(query.get('pageSize') || '20')

  const [total, list] = await Promise.all([
    prisma.pointRecord.count({ where: { userId: user.id } }),
    prisma.pointRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return sendSuccess(res, { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}

// ==================== 消息 ====================

async function handleMessages(req: any, res: any, params: any, query: URLSearchParams) {
  const user = (req as any)._user
  const page = parseInt(query.get('page') || '1')
  const pageSize = parseInt(query.get('pageSize') || '20')

  const [total, list] = await Promise.all([
    prisma.message.count({ where: { userId: user.id } }),
    prisma.message.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return sendSuccess(res, { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}

async function handleUnreadMessages(req: any, res: any) {
  const user = (req as any)._user
  const list = await prisma.message.findMany({
    where: { userId: user.id, isRead: false },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  return sendSuccess(res, { list, count: list.length })
}

async function handleMarkRead(req: any, res: any, params: any) {
  const { id } = params
  const user = (req as any)._user
  await prisma.message.updateMany({ where: { id, userId: user.id }, data: { isRead: true } })
  return sendSuccess(res, null, '已标记为已读')
}
