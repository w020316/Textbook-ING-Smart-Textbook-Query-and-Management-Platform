// 公开接口 API 处理器（无需认证）
import { prisma, sendSuccess, sendError } from './_lib.js'

// 学期列表
export async function handleSemesters(req: any, res: any) {
  const list = await prisma.semester.findMany({
    orderBy: { startDate: 'desc' },
  })
  return sendSuccess(res, list)
}

// 校历
export async function handleCalendar(req: any, res: any, params: any, query: URLSearchParams) {
  const semesterId = query.get('semesterId')
  if (!semesterId) return sendError(res, '请选择学期')

  const weeks = await prisma.calendarWeek.findMany({
    where: { semesterId },
    orderBy: { weekNumber: 'asc' },
  })
  return sendSuccess(res, weeks)
}

// 统计
export async function handleStats(req: any, res: any) {
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
