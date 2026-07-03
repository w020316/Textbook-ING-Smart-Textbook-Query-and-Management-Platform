// 公开接口 API 处理器（无需认证）
import { prisma, sendSuccess, sendError } from './_lib.js'
import { getCache, setCache } from './_cache.js'

// 学期列表（低频变更，缓存 30 分钟）
export async function handleSemesters(req: any, res: any) {
  const cacheKey = 'public:semesters'
  const cached = getCache<any>(cacheKey)
  if (cached) return sendSuccess(res, cached)

  const list = await prisma.semester.findMany({
    orderBy: { startDate: 'desc' },
  })
  setCache(cacheKey, list, 30 * 60)
  return sendSuccess(res, list)
}

// 校历（按学期缓存 30 分钟）
export async function handleCalendar(req: any, res: any, params: any, query: URLSearchParams) {
  const semesterId = query.get('semesterId')
  if (!semesterId) return sendError(res, '请选择学期')

  const cacheKey = `public:calendar:${semesterId}`
  const cached = getCache<any>(cacheKey)
  if (cached) return sendSuccess(res, cached)

  const weeks = await prisma.calendarWeek.findMany({
    where: { semesterId },
    orderBy: { weekNumber: 'asc' },
  })
  setCache(cacheKey, weeks, 30 * 60)
  return sendSuccess(res, weeks)
}

// 统计（首页展示，缓存 5 分钟平衡实时性与性能）
export async function handleStats(req: any, res: any) {
  const cacheKey = 'public:stats'
  const cached = getCache<any>(cacheKey)
  if (cached) return sendSuccess(res, cached)

  const [semesters, textbooks, users, colleges] = await Promise.all([
    prisma.semester.count(),
    prisma.textbook.count(),
    prisma.user.count(),
    prisma.college.count(),
  ])

  const data = {
    semesterCount: semesters,
    textbookCount: textbooks,
    userCount: users,
    collegeCount: colleges,
  }
  setCache(cacheKey, data, 5 * 60)
  return sendSuccess(res, data)
}
