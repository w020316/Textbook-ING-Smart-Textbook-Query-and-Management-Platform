// 新闻相关 API 处理器（用户端）
import { prisma, sendSuccess, sendError, getRequestBody } from './_lib.js'
import { sanitizeHtml } from './_sanitize.js'

// 阅读数去重（内存 Set + TTL 1小时）
const viewSet = new Map<string, number>() // key: ip:newsId -> timestamp
const VIEW_TTL = 60 * 60 * 1000 // 1小时

function shouldCountView(ip: string, newsId: string): boolean {
  const key = `${ip}:${newsId}`
  const now = Date.now()
  const last = viewSet.get(key)
  if (last && now - last < VIEW_TTL) {
    return false // 1小时内已访问过，不计数
  }
  viewSet.set(key, now)
  // 清理过期记录（避免内存泄漏）
  if (viewSet.size > 10000) {
    for (const [k, t] of viewSet) {
      if (now - t > VIEW_TTL) viewSet.delete(k)
    }
  }
  return true
}

// 新闻分类
export async function handleNewsCategories(req: any, res: any) {
  const list = await prisma.newsCategory.findMany({
    orderBy: { sort: 'asc' },
    include: { _count: { select: { news: true } } },
  })
  return sendSuccess(res, list)
}

// 新闻列表
// 注意：只做一次 findMany 查询，不做 count 查询。
// 原因：Vercel Hobby 计划函数超时 10 秒，连接 Neon（新加坡）单次查询约 3-5 秒，
// 两次串行查询（count + findMany）会超时导致 FUNCTION_INVOCATION_FAILED。
// 用 take: pageSize + 1 判断是否有下一页，估算 total。
export async function handleNewsList(req: any, res: any, params: any, query: URLSearchParams) {
  const page = Math.max(1, parseInt(query.get('page') || '1'))
  const pageSize = Math.min(50, Math.max(1, parseInt(query.get('pageSize') || '10')))
  const categoryId = query.get('categoryId') || ''

  const where: any = {}
  if (categoryId) where.categoryId = categoryId

  // 只做一次查询：多取 1 条用于判断是否有下一页
  const allNews = await prisma.news.findMany({
    where,
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    skip: (page - 1) * pageSize,
    take: pageSize + 1,
    select: {
      id: true,
      title: true,
      summary: true,
      coverImage: true,
      isPinned: true,
      viewCount: true,
      createdAt: true,
      categoryId: true,
    },
  })

  const hasNext = allNews.length > pageSize
  const items = allNews.slice(0, pageSize)
  // 估算 total：有下一页时取下限，无下一页时为精确值
  const total = hasNext ? page * pageSize + 1 : (page - 1) * pageSize + items.length

  return sendSuccess(res, {
    list: items,
    total,
    page,
    pageSize,
    totalPages: hasNext ? page + 1 : page,
  })
}

// 新闻详情
export async function handleNewsDetail(req: any, res: any, params: any) {
  const { id } = params
  const ip = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'

  try {
    // 阅读数去重
    const shouldCount = shouldCountView(String(ip).split(',')[0].trim(), id)
    const news = await prisma.news.update({
      where: { id },
      data: shouldCount ? { viewCount: { increment: 1 } } : {},
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
  } catch (err: any) {
    console.error('[News Detail Error]:', err.message)
    return sendError(res, '新闻加载失败，请稍后重试', 5, 500)
  }
}

// 新闻评论列表
export async function handleNewsComments(req: any, res: any, params: any, query: URLSearchParams) {
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

// 添加评论
export async function handleAddComment(req: any, res: any, params: any) {
  const { id } = params
  const user = (req as any)._user
  const body = await getRequestBody(req)
  const content = body.content?.trim()

  if (!content) return sendError(res, '评论内容不能为空')
  if (content.length > 500) return sendError(res, '评论内容不能超过500字')

  const news = await prisma.news.findUnique({ where: { id } })
  if (!news) return sendError(res, '新闻不存在', 4, 404)

  // XSS 清洗
  const safeContent = sanitizeHtml(content)

  const comment = await prisma.comment.create({
    data: { content: safeContent, userId: user.id, newsId: id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  })

  // 评论奖励积分
  await prisma.user.update({ where: { id: user.id }, data: { points: { increment: 2 } } })
  await prisma.pointRecord.create({
    data: { userId: user.id, amount: 2, reason: '评论奖励', balance: user.points + 2 },
  })

  return sendSuccess(res, comment, '评论成功')
}
