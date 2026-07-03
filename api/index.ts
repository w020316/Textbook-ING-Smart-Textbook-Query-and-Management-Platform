// 教材ING API 主路由 - Catch-all Handler
// 职责：路由匹配 + 认证守卫 + 限流 + 缓存 + 分发到各模块
import { getUserFromRequest, sendError } from './_lib.js'
import { rateLimit } from './_rateLimit.js'
import { getCache, setCache, invalidateCache } from './_cache.js'

// 认证模块
import { handleSendCode, handleRegister, handleLogin, handleLogout, handleForgotPassword, handleResetPassword, handleMe } from './_auth.js'
// 教材模块
import { handleTextbookList, handleTextbookDetail, handleHotSearches, handleColleges, handleMajors, handleClasses } from './_textbook.js'
// 新闻模块
import { handleNewsCategories, handleNewsList, handleNewsDetail, handleNewsComments, handleAddComment } from './_news.js'
// 公开模块
import { handleSemesters, handleCalendar, handleStats } from './_public.js'
// 用户模块
import { handlePointsBalance, handlePointsRecords, handleMessages, handleUnreadMessages, handleMarkRead, handleCheckIn } from './_user.js'
// 管理后台模块
import {
  handleAdminTextbookList, handleAdminTextbookCreate, handleAdminTextbookUpdate, handleAdminTextbookDelete,
  handleAdminNewsList, handleAdminNewsCreate, handleAdminNewsUpdate, handleAdminNewsDelete, handleAdminNewsTogglePin,
  handleAdminUserList, handleAdminUserUpdate, handleAdminUserUpdatePoints,
  handleAdminSemesterList, handleAdminSemesterCreate, handleAdminSemesterUpdate, handleAdminSemesterDelete, handleAdminWeekBatchCreate,
  handleAdminCollegeList, handleAdminCollegeCreate, handleAdminCollegeUpdate, handleAdminCollegeDelete,
  handleAdminMajorCreate, handleAdminMajorDelete, handleAdminClassCreate, handleAdminClassDelete,
  handleAdminStats, handleAdminCourseList, handleAdminCategoryList,
} from './_admin.js'

// ==================== 路由匹配 ====================
type Handler = (req: any, res: any, params: Record<string, string>, query: URLSearchParams) => Promise<void>

interface Route {
  method: string
  pattern: string
  handler: Handler
  auth?: boolean
  // 限流配置：每分钟最大请求数
  rateLimit?: number
  // 缓存配置：有效期（秒），仅对 GET 公开接口生效
  cache?: number
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
  { method: 'POST', pattern: '/api/auth/send-code', handler: handleSendCode, rateLimit: 5 },
  { method: 'POST', pattern: '/api/auth/register', handler: handleRegister, rateLimit: 5 },
  { method: 'POST', pattern: '/api/auth/login', handler: handleLogin, rateLimit: 10 },
  { method: 'POST', pattern: '/api/auth/logout', handler: handleLogout, auth: true },
  { method: 'POST', pattern: '/api/auth/forgot-password', handler: handleForgotPassword, rateLimit: 5 },
  { method: 'POST', pattern: '/api/auth/reset-password', handler: handleResetPassword, rateLimit: 5 },
  { method: 'GET', pattern: '/api/auth/me', handler: handleMe, auth: true },

  // --- 教材 ---
  { method: 'GET', pattern: '/api/textbooks', handler: handleTextbookList, auth: true },
  { method: 'GET', pattern: '/api/textbooks/hot-searches', handler: handleHotSearches },
  { method: 'GET', pattern: '/api/textbooks/:id', handler: handleTextbookDetail, auth: true },

  // --- 学院/专业/班级（公开，用于校历查询和教材查询的筛选下拉） ---
  { method: 'GET', pattern: '/api/colleges', handler: handleColleges },
  { method: 'GET', pattern: '/api/colleges/:id/majors', handler: handleMajors },
  { method: 'GET', pattern: '/api/majors/:id/classes', handler: handleClasses },

  // --- 校历 ---
  { method: 'GET', pattern: '/api/semesters', handler: handleSemesters, cache: 300 },
  { method: 'GET', pattern: '/api/calendar', handler: handleCalendar, cache: 300 },

  // --- 新闻 ---
  { method: 'GET', pattern: '/api/news/categories', handler: handleNewsCategories, cache: 600 },
  { method: 'GET', pattern: '/api/news', handler: handleNewsList, cache: 600 },
  { method: 'GET', pattern: '/api/news/:id', handler: handleNewsDetail },
  { method: 'GET', pattern: '/api/news/:id/comments', handler: handleNewsComments },
  { method: 'POST', pattern: '/api/news/:id/comments', handler: handleAddComment, auth: true, rateLimit: 10 },

  // --- 统计 ---
  { method: 'GET', pattern: '/api/stats', handler: handleStats, cache: 60 },

  // --- 积分 ---
  { method: 'GET', pattern: '/api/points/balance', handler: handlePointsBalance, auth: true },
  { method: 'GET', pattern: '/api/points/records', handler: handlePointsRecords, auth: true },

  // --- 消息 ---
  { method: 'GET', pattern: '/api/messages', handler: handleMessages, auth: true },
  { method: 'GET', pattern: '/api/messages/unread', handler: handleUnreadMessages, auth: true },
  { method: 'PUT', pattern: '/api/messages/:id/read', handler: handleMarkRead, auth: true },

  // --- 签到 ---
  { method: 'POST', pattern: '/api/user/check-in', handler: handleCheckIn, auth: true, rateLimit: 1 },

  // --- 管理后台：教材 ---
  { method: 'GET', pattern: '/api/admin/textbooks', handler: handleAdminTextbookList, auth: true, cache: 120 },
  { method: 'POST', pattern: '/api/admin/textbooks', handler: handleAdminTextbookCreate, auth: true },
  { method: 'PUT', pattern: '/api/admin/textbooks/:id', handler: handleAdminTextbookUpdate, auth: true },
  { method: 'DELETE', pattern: '/api/admin/textbooks/:id', handler: handleAdminTextbookDelete, auth: true },

  // --- 管理后台：新闻 ---
  { method: 'GET', pattern: '/api/admin/news', handler: handleAdminNewsList, auth: true, cache: 120 },
  { method: 'POST', pattern: '/api/admin/news', handler: handleAdminNewsCreate, auth: true },
  { method: 'PUT', pattern: '/api/admin/news/:id', handler: handleAdminNewsUpdate, auth: true },
  { method: 'DELETE', pattern: '/api/admin/news/:id', handler: handleAdminNewsDelete, auth: true },
  { method: 'PUT', pattern: '/api/admin/news/:id/pin', handler: handleAdminNewsTogglePin, auth: true },

  // --- 管理后台：用户 ---
  { method: 'GET', pattern: '/api/admin/users', handler: handleAdminUserList, auth: true, cache: 60 },
  { method: 'PUT', pattern: '/api/admin/users/:id', handler: handleAdminUserUpdate, auth: true },
  { method: 'PUT', pattern: '/api/admin/users/:id/points', handler: handleAdminUserUpdatePoints, auth: true },

  // --- 管理后台：校历 ---
  { method: 'GET', pattern: '/api/admin/semesters', handler: handleAdminSemesterList, auth: true, cache: 300 },
  { method: 'POST', pattern: '/api/admin/semesters', handler: handleAdminSemesterCreate, auth: true },
  { method: 'PUT', pattern: '/api/admin/semesters/:id', handler: handleAdminSemesterUpdate, auth: true },
  { method: 'DELETE', pattern: '/api/admin/semesters/:id', handler: handleAdminSemesterDelete, auth: true },
  { method: 'POST', pattern: '/api/admin/calendar/weeks/batch', handler: handleAdminWeekBatchCreate, auth: true },

  // --- 管理后台：学院/专业/班级 ---
  { method: 'GET', pattern: '/api/admin/colleges', handler: handleAdminCollegeList, auth: true, cache: 300 },
  { method: 'POST', pattern: '/api/admin/colleges', handler: handleAdminCollegeCreate, auth: true },
  { method: 'PUT', pattern: '/api/admin/colleges/:id', handler: handleAdminCollegeUpdate, auth: true },
  { method: 'DELETE', pattern: '/api/admin/colleges/:id', handler: handleAdminCollegeDelete, auth: true },
  { method: 'POST', pattern: '/api/admin/majors', handler: handleAdminMajorCreate, auth: true },
  { method: 'DELETE', pattern: '/api/admin/majors/:id', handler: handleAdminMajorDelete, auth: true },
  { method: 'POST', pattern: '/api/admin/classes', handler: handleAdminClassCreate, auth: true },
  { method: 'DELETE', pattern: '/api/admin/classes/:id', handler: handleAdminClassDelete, auth: true },

  // --- 管理后台：统计 ---
  { method: 'GET', pattern: '/api/admin/stats', handler: handleAdminStats, auth: true, cache: 120 },

  // --- 管理后台：辅助 ---
  { method: 'GET', pattern: '/api/admin/courses', handler: handleAdminCourseList, auth: true, cache: 300 },
  { method: 'GET', pattern: '/api/admin/categories', handler: handleAdminCategoryList, auth: true, cache: 600 },
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
        // 限流检查
        if (route.rateLimit) {
          const ip = (req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString().split(',')[0].trim()
          const allowed = rateLimit(`${ip}:${route.pattern}`, route.rateLimit)
          if (!allowed) {
            return sendError(res, '请求过于频繁，请稍后再试', 6, 429)
          }
        }

        // 认证检查
        if (route.auth) {
          const user = await getUserFromRequest(req)
          if (!user) return sendError(res, '未认证，请先登录', 2, 401)
          ;(req as any)._user = user
        }

        // 缓存检查（仅 GET 公开接口）
        if (route.cache && method === 'GET') {
          const cacheKey = `get:${path}:${query.toString()}`
          const cached = getCache<any>(cacheKey)
          if (cached) {
            return res.status(200).json(cached)
          }
          // 包装 res.json 以捕获响应数据
          const originalJson = res.json.bind(res)
          res.json = (body: any) => {
            // 仅缓存成功响应（code === 0）
            if (body?.code === 0) {
              setCache(cacheKey, body, route.cache)
            }
            return originalJson(body)
          }
        }

        await route.handler(req, res, params, query)

        // 管理后台写操作后清除公开接口缓存（避免脏数据）
        if (method !== 'GET' && path.startsWith('/api/admin/')) {
          invalidateCache('get:')
        }
        return
      } catch (err: any) {
        console.error(`[API Error] ${method} ${path}:`, err)
        return sendError(res, err.message || '服务器内部错误', 5, 500)
      }
    }
  }

  return sendError(res, '接口不存在', 4, 404)
}
