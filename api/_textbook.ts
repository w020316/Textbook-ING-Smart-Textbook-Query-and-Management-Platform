// 教材查询相关 API 处理器（用户端）
import { prisma, sendSuccess, sendError } from './_lib.js'
import { getCache, setCache } from './_cache.js'

// 教材列表
export async function handleTextbookList(req: any, res: any, params: any, query: URLSearchParams) {
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

// 教材详情
export async function handleTextbookDetail(req: any, res: any, params: any) {
  const { id } = params
  const textbook = await prisma.textbook.findUnique({
    where: { id },
    include: { course: { include: { semester: true } }, class: { include: { major: { include: { college: true } } } } },
  })
  if (!textbook) return sendError(res, '教材不存在', 4, 404)
  return sendSuccess(res, textbook)
}

// 热门搜索（缓存 10 分钟）
export async function handleHotSearches(req: any, res: any) {
  const cacheKey = 'public:hot-searches'
  const cached = getCache<any>(cacheKey)
  if (cached) return sendSuccess(res, cached)

  const list = await prisma.hotSearch.findMany({
    orderBy: { count: 'desc' },
    take: 10,
  })
  setCache(cacheKey, list, 10 * 60)
  return sendSuccess(res, list)
}

// 学院列表（低频变更，缓存 60 分钟）
export async function handleColleges(req: any, res: any) {
  const cacheKey = 'public:colleges'
  const cached = getCache<any>(cacheKey)
  if (cached) return sendSuccess(res, cached)

  const list = await prisma.college.findMany({
    orderBy: { sort: 'asc' },
    include: { _count: { select: { majors: true } } },
  })
  setCache(cacheKey, list, 60 * 60)
  return sendSuccess(res, list)
}

// 专业列表
export async function handleMajors(req: any, res: any, params: any) {
  const { id } = params
  const list = await prisma.major.findMany({
    where: { collegeId: id },
    orderBy: { sort: 'asc' },
    include: { _count: { select: { classes: true } } },
  })
  return sendSuccess(res, list)
}

// 班级列表
export async function handleClasses(req: any, res: any, params: any) {
  const { id } = params
  const list = await prisma.class.findMany({
    where: { majorId: id },
    orderBy: { grade: 'desc' },
  })
  return sendSuccess(res, list)
}
