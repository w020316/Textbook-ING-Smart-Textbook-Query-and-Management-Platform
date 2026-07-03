// 管理后台 API 处理器（需 ADMIN 角色）
import { prisma, sendSuccess, sendError, getRequestBody } from './_lib.js'
import { sanitizeRichHtml } from './_sanitize.js'
import { invalidateCache } from './_cache.js'

// 管理员权限校验（在 index.ts 的 auth 守卫之后调用）
function checkAdmin(req: any, res: any): boolean {
  const user = (req as any)._user
  if (!user || user.role !== 'ADMIN') {
    sendError(res, '无权限访问', 3, 403)
    return false
  }
  return true
}

// ==================== 教材管理 ====================

export async function handleAdminTextbookList(req: any, res: any, _params: any, query: URLSearchParams) {
  if (!checkAdmin(req, res)) return
  const page = parseInt(query.get('page') || '1')
  const pageSize = parseInt(query.get('pageSize') || '20')
  const keyword = query.get('keyword') || ''

  const where: any = {}
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { author: { contains: keyword, mode: 'insensitive' } },
      { isbn: { contains: keyword } },
    ]
  }

  const [total, list] = await Promise.all([
    prisma.textbook.count({ where }),
    prisma.textbook.findMany({
      where,
      include: { course: { include: { semester: true } }, class: { include: { major: { include: { college: true } } } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { title: 'asc' },
    }),
  ])
  return sendSuccess(res, { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}

export async function handleAdminTextbookCreate(req: any, res: any) {
  if (!checkAdmin(req, res)) return
  const body = await getRequestBody(req)
  const { title, author, publisher, isbn, price, courseId, classId, coverImage } = body
  if (!title || !author || !courseId) return sendError(res, '书名、作者、课程为必填')
  const tb = await prisma.textbook.create({
    data: { title, author, publisher: publisher || '', isbn: isbn || '', price: price || 0, courseId, classId: classId || null, coverImage: coverImage || null },
  })
  // 教材数量变化，失效统计缓存
  invalidateCache('public:stats')
  return sendSuccess(res, tb, '创建成功')
}

export async function handleAdminTextbookUpdate(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  const body = await getRequestBody(req)
  const { title, author, publisher, isbn, price, courseId, classId, coverImage } = body
  const tb = await prisma.textbook.update({
    where: { id },
    data: { title, author, publisher, isbn, price, courseId, classId: classId || null, coverImage },
  })
  return sendSuccess(res, tb, '更新成功')
}

export async function handleAdminTextbookDelete(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  await prisma.textbook.delete({ where: { id } })
  // 教材数量变化，失效统计缓存
  invalidateCache('public:stats')
  return sendSuccess(res, null, '删除成功')
}

// ==================== 新闻管理 ====================

export async function handleAdminNewsList(req: any, res: any, _params: any, query: URLSearchParams) {
  if (!checkAdmin(req, res)) return
  const page = parseInt(query.get('page') || '1')
  const pageSize = parseInt(query.get('pageSize') || '20')
  const keyword = query.get('keyword') || ''

  const where: any = {}
  if (keyword) where.title = { contains: keyword, mode: 'insensitive' }

  const [total, list] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({
      where,
      include: { category: true, author: { select: { name: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ])
  return sendSuccess(res, { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}

export async function handleAdminNewsCreate(req: any, res: any) {
  if (!checkAdmin(req, res)) return
  const user = (req as any)._user
  const body = await getRequestBody(req)
  const { title, content, summary, categoryId, coverImage } = body
  if (!title || !content || !categoryId) return sendError(res, '标题、内容、分类为必填')
  const news = await prisma.news.create({
    data: {
      title,
      content: sanitizeRichHtml(content),
      summary: summary || '',
      categoryId,
      authorId: user.id,
      coverImage: coverImage || null,
    },
  })
  // 失效新闻相关缓存
  invalidateCache('public:news:')
  return sendSuccess(res, news, '创建成功')
}

export async function handleAdminNewsUpdate(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  const body = await getRequestBody(req)
  const { title, content, summary, categoryId, coverImage } = body
  const news = await prisma.news.update({
    where: { id },
    data: {
      title,
      content: content ? sanitizeRichHtml(content) : undefined,
      summary,
      categoryId,
      coverImage,
    },
  })
  // 失效新闻相关缓存
  invalidateCache('public:news:')
  return sendSuccess(res, news, '更新成功')
}

export async function handleAdminNewsDelete(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  await prisma.news.delete({ where: { id } })
  // 失效新闻相关缓存
  invalidateCache('public:news:')
  return sendSuccess(res, null, '删除成功')
}

export async function handleAdminNewsTogglePin(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  const news = await prisma.news.findUnique({ where: { id } })
  if (!news) return sendError(res, '新闻不存在', 4, 404)
  const updated = await prisma.news.update({ where: { id }, data: { isPinned: !news.isPinned } })
  // 失效新闻列表缓存（置顶状态影响列表顺序）
  invalidateCache('public:news:list:')
  return sendSuccess(res, updated, updated.isPinned ? '已置顶' : '已取消置顶')
}

// ==================== 用户管理 ====================

export async function handleAdminUserList(req: any, res: any, _params: any, query: URLSearchParams) {
  if (!checkAdmin(req, res)) return
  const page = parseInt(query.get('page') || '1')
  const pageSize = parseInt(query.get('pageSize') || '20')
  const keyword = query.get('keyword') || ''
  const role = query.get('role') || ''

  const where: any = {}
  if (keyword) {
    where.OR = [
      { email: { contains: keyword, mode: 'insensitive' } },
      { name: { contains: keyword, mode: 'insensitive' } },
    ]
  }
  if (role) where.role = role

  const [total, list] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, role: true, avatar: true, points: true, emailVerified: true, createdAt: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ])
  return sendSuccess(res, { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}

export async function handleAdminUserUpdate(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  const body = await getRequestBody(req)
  const { role } = body
  if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) return sendError(res, '无效的角色')
  const user = await prisma.user.update({ where: { id }, data: { role }, select: { id: true, email: true, name: true, role: true, points: true } })
  return sendSuccess(res, user, '更新成功')
}

export async function handleAdminUserUpdatePoints(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  const body = await getRequestBody(req)
  const { amount, reason } = body
  if (typeof amount !== 'number') return sendError(res, '积分增减值必须为数字')

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return sendError(res, '用户不存在', 4, 404)

  const newBalance = user.points + amount
  await prisma.user.update({ where: { id }, data: { points: newBalance } })
  await prisma.pointRecord.create({
    data: { userId: id, amount, reason: reason || '管理员调整', balance: newBalance },
  })
  return sendSuccess(res, { points: newBalance }, '积分调整成功')
}

// ==================== 校历管理 ====================

export async function handleAdminSemesterList(req: any, res: any) {
  if (!checkAdmin(req, res)) return
  const list = await prisma.semester.findMany({ orderBy: { startDate: 'desc' } })
  return sendSuccess(res, list)
}

export async function handleAdminSemesterCreate(req: any, res: any) {
  if (!checkAdmin(req, res)) return
  const body = await getRequestBody(req)
  const { name, startDate, endDate, totalWeeks } = body
  if (!name || !startDate || !endDate) return sendError(res, '名称、开始/结束日期为必填')
  const sem = await prisma.semester.create({
    data: { name, startDate: new Date(startDate), endDate: new Date(endDate), totalWeeks: totalWeeks || 20 },
  })
  return sendSuccess(res, sem, '创建成功')
}

export async function handleAdminSemesterUpdate(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  const body = await getRequestBody(req)
  const { name, startDate, endDate, totalWeeks, isActive } = body
  // 设为活跃时，先取消其他学期的活跃状态
  if (isActive) {
    await prisma.semester.updateMany({ where: { isActive: true }, data: { isActive: false } })
  }
  const sem = await prisma.semester.update({
    where: { id },
    data: {
      name,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      totalWeeks,
      isActive,
    },
  })
  return sendSuccess(res, sem, '更新成功')
}

export async function handleAdminSemesterDelete(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  await prisma.semester.delete({ where: { id } })
  return sendSuccess(res, null, '删除成功')
}

// 批量生成教学周
export async function handleAdminWeekBatchCreate(req: any, res: any) {
  if (!checkAdmin(req, res)) return
  const body = await getRequestBody(req)
  const { semesterId } = body
  if (!semesterId) return sendError(res, '学期ID为必填')

  const semester = await prisma.semester.findUnique({ where: { id: semesterId } })
  if (!semester) return sendError(res, '学期不存在', 4, 404)

  // 清理旧周次
  await prisma.calendarWeek.deleteMany({ where: { semesterId } })

  // 按周生成
  const weeks = []
  const start = new Date(semester.startDate)
  for (let i = 0; i < semester.totalWeeks; i++) {
    const weekStart = new Date(start)
    weekStart.setDate(start.getDate() + i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weeks.push({
      semesterId,
      weekNumber: i + 1,
      startDate: weekStart,
      endDate: weekEnd,
      eventType: 'NORMAL' as const,
    })
  }
  await prisma.calendarWeek.createMany({ data: weeks })
  return sendSuccess(res, { count: weeks.length }, `已生成 ${weeks.length} 周教学周`)
}

// ==================== 学院管理 ====================

export async function handleAdminCollegeList(req: any, res: any) {
  if (!checkAdmin(req, res)) return
  const list = await prisma.college.findMany({
    orderBy: { sort: 'asc' },
    include: {
      majors: {
        orderBy: { sort: 'asc' },
        include: {
          classes: { orderBy: { grade: 'desc' } },
          _count: { select: { classes: true } },
        },
      },
      _count: { select: { majors: true } },
    },
  })
  return sendSuccess(res, list)
}

export async function handleAdminCollegeCreate(req: any, res: any) {
  if (!checkAdmin(req, res)) return
  const body = await getRequestBody(req)
  const { name, code, sort } = body
  if (!name || !code) return sendError(res, '名称和代码为必填')
  const college = await prisma.college.create({ data: { name, code, sort: sort || 0 } })
  // 学院数据变化，失效学院列表和统计缓存
  invalidateCache('public:colleges')
  invalidateCache('public:stats')
  return sendSuccess(res, college, '创建成功')
}

export async function handleAdminCollegeUpdate(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  const body = await getRequestBody(req)
  const college = await prisma.college.update({ where: { id }, data: body })
  // 学院数据变化，失效学院列表缓存
  invalidateCache('public:colleges')
  return sendSuccess(res, college, '更新成功')
}

export async function handleAdminCollegeDelete(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  await prisma.college.delete({ where: { id } })
  // 学院数据变化，失效学院列表和统计缓存
  invalidateCache('public:colleges')
  invalidateCache('public:stats')
  return sendSuccess(res, null, '删除成功')
}

export async function handleAdminMajorCreate(req: any, res: any) {
  if (!checkAdmin(req, res)) return
  const body = await getRequestBody(req)
  const { name, code, collegeId, sort } = body
  if (!name || !code || !collegeId) return sendError(res, '名称、代码、学院为必填')
  const major = await prisma.major.create({ data: { name, code, collegeId, sort: sort || 0 } })
  return sendSuccess(res, major, '创建成功')
}

export async function handleAdminMajorDelete(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  await prisma.major.delete({ where: { id } })
  return sendSuccess(res, null, '删除成功')
}

export async function handleAdminClassCreate(req: any, res: any) {
  if (!checkAdmin(req, res)) return
  const body = await getRequestBody(req)
  const { name, grade, majorId } = body
  if (!name || !majorId || !grade) return sendError(res, '名称、年级、专业为必填')
  const cls = await prisma.class.create({ data: { name, grade: parseInt(grade), majorId } })
  return sendSuccess(res, cls, '创建成功')
}

export async function handleAdminClassDelete(req: any, res: any, params: any) {
  if (!checkAdmin(req, res)) return
  const { id } = params
  await prisma.class.delete({ where: { id } })
  return sendSuccess(res, null, '删除成功')
}

// ==================== 统计聚合 ====================

export async function handleAdminStats(req: any, res: any) {
  if (!checkAdmin(req, res)) return
  const [users, textbooks, news, colleges, majors, classes, courses, semesters] = await Promise.all([
    prisma.user.count(),
    prisma.textbook.count(),
    prisma.news.count(),
    prisma.college.count(),
    prisma.major.count(),
    prisma.class.count(),
    prisma.course.count(),
    prisma.semester.count(),
  ])

  // 近7天注册趋势
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  const trend: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(d.getDate() + 1)
    const count = recentUsers.filter(u => u.createdAt >= d && u.createdAt < next).length
    trend.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, count })
  }

  // 热门搜索 Top10
  const hotSearches = await prisma.hotSearch.findMany({ orderBy: { count: 'desc' }, take: 10 })

  return sendSuccess(res, {
    counts: { users, textbooks, news, colleges, majors, classes, courses, semesters },
    registerTrend: trend,
    hotSearches,
  })
}

// ==================== 课程/分类（辅助接口） ====================

export async function handleAdminCourseList(req: any, res: any, _params: any, query: URLSearchParams) {
  if (!checkAdmin(req, res)) return
  const semesterId = query.get('semesterId')
  const list = await prisma.course.findMany({
    where: semesterId ? { semesterId } : undefined,
    include: { semester: true },
    orderBy: { name: 'asc' },
  })
  return sendSuccess(res, list)
}

export async function handleAdminCategoryList(req: any, res: any) {
  if (!checkAdmin(req, res)) return
  const list = await prisma.newsCategory.findMany({ orderBy: { sort: 'asc' } })
  return sendSuccess(res, list)
}
