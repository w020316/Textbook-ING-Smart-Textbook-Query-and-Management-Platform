// 教材ING - 全局类型定义

// ==================== 通用响应类型 ====================

/** 业务状态码：0=成功, 1=参数错误, 2=未认证, 3=无权限, 4=不存在, 5=服务器错误 */
export type ApiCode = 0 | 1 | 2 | 3 | 4 | 5

/** 统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: ApiCode
  message: string
  data: T
  timestamp: number
}

/** 分页响应结构 */
export interface PaginatedResponse<T = unknown> {
  list: T[]
  total: number
  current: number
  pageSize: number
}

/** 分页查询参数 */
export interface PageQuery {
  current?: number
  pageSize?: number
  keyword?: string
}

// ==================== 枚举类型 ====================

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN'

export type EventType = 'NORMAL' | 'START' | 'EXAM' | 'HOLIDAY'

// ==================== 用户系统 ====================

/** 用户信息 */
export interface User {
  id: string
  email: string
  name: string
  role: Role
  avatar?: string | null
  points: number
  emailVerified?: string | null
  createdAt: string
}

// ==================== 学院/专业/班级 ====================

/** 学院 */
export interface College {
  id: string
  name: string
  code: string
  sort?: number
}

/** 专业 */
export interface Major {
  id: string
  name: string
  code: string
  collegeId: string
  sort?: number
}

/** 班级 */
export interface Class {
  id: string
  name: string
  grade: number
  majorId: string
}

// ==================== 学期/课程/教材 ====================

/** 学期 */
export interface Semester {
  id: string
  name: string
  startDate: string
  endDate: string
  totalWeeks: number
  isActive: boolean
}

/** 课程 */
export interface Course {
  id: string
  name: string
  code: string
  credits: number
  semesterId: string
}

/** 教材 */
export interface Textbook {
  id: string
  title: string
  author: string
  publisher: string
  isbn: string
  price: number
  coverImage?: string | null
  courseId: string
  classId?: string | null
  course?: Course
}

// ==================== 校历 ====================

/** 校历周次 */
export interface CalendarWeek {
  id: string
  semesterId: string
  weekNumber: number
  startDate: string
  endDate: string
  event?: string | null
  eventType: EventType
}

// ==================== 新闻系统 ====================

/** 新闻分类 */
export interface NewsCategory {
  id: string
  name: string
  slug: string
  sort?: number
}

/** 新闻 */
export interface News {
  id: string
  title: string
  content: string
  summary: string
  coverImage?: string | null
  categoryId: string
  authorId: string
  isPinned: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  category?: NewsCategory
  author?: Pick<User, 'id' | 'name' | 'avatar'>
}

/** 评论 */
export interface Comment {
  id: string
  content: string
  userId: string
  newsId: string
  createdAt: string
  user?: Pick<User, 'id' | 'name' | 'avatar'>
}

// ==================== 积分系统 ====================

/** 积分记录 */
export interface PointRecord {
  id: string
  userId: string
  amount: number
  reason: string
  balance: number
  createdAt: string
}

// ==================== 消息系统 ====================

/** 站内消息 */
export interface Message {
  id: string
  userId: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
}

// ==================== 热门搜索 ====================

/** 热门搜索词 */
export interface HotSearch {
  id: string
  keyword: string
  count: number
  createdAt: string
}

// ==================== 统计数据 ====================

/** 首页统计数据 */
export interface Stats {
  semesterCount: number
  textbookCount: number
  userCount: number
  collegeCount: number
}

// ==================== 表单类型 ====================

/** 登录表单 */
export interface LoginForm {
  email: string
  password: string
}

/** 注册表单 */
export interface RegisterForm {
  email: string
  password: string
  name: string
  code: string
}

/** 忘记密码表单 */
export interface ForgotPasswordForm {
  email: string
  code: string
  password: string
}

/** 登录成功返回 */
export interface LoginResult {
  token: string
  user: User
}
