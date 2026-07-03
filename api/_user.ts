// 用户端 API 处理器（需认证：个人中心/积分/消息）
import { prisma, sendSuccess, sendError, getRequestBody, hashPassword } from './_lib.js'

// 积分余额
export async function handlePointsBalance(req: any, res: any) {
  const user = (req as any)._user
  return sendSuccess(res, { points: user.points })
}

// 积分明细
export async function handlePointsRecords(req: any, res: any, params: any, query: URLSearchParams) {
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

// 消息列表
export async function handleMessages(req: any, res: any, params: any, query: URLSearchParams) {
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

// 未读消息
export async function handleUnreadMessages(req: any, res: any) {
  const user = (req as any)._user
  const list = await prisma.message.findMany({
    where: { userId: user.id, isRead: false },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  return sendSuccess(res, { list, count: list.length })
}

// 标记已读
export async function handleMarkRead(req: any, res: any, params: any) {
  const { id } = params
  const user = (req as any)._user
  await prisma.message.updateMany({ where: { id, userId: user.id }, data: { isRead: true } })
  return sendSuccess(res, null, '已标记为已读')
}

// 签到
export async function handleCheckIn(req: any, res: any) {
  const user = (req as any)._user
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 检查今日是否已签到
  const todayRecord = await prisma.pointRecord.findFirst({
    where: {
      userId: user.id,
      reason: '每日签到',
      createdAt: { gte: today },
    },
  })
  if (todayRecord) {
    return sendError(res, '今日已签到')
  }

  // 签到奖励（连续签到可加积分，简化为固定2分）
  const reward = 2
  await prisma.user.update({ where: { id: user.id }, data: { points: { increment: reward } } })
  await prisma.pointRecord.create({
    data: { userId: user.id, amount: reward, reason: '每日签到', balance: user.points + reward },
  })

  return sendSuccess(res, { reward, balance: user.points + reward }, '签到成功')
}
