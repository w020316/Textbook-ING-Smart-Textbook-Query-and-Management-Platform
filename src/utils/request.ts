// Axios HTTP 请求封装
import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types'

// baseURL：优先读取环境变量，默认 /api
const baseURL = import.meta.env.VITE_API_BASE || '/api'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// token 在 localStorage 中的 key
export const TOKEN_KEY = 'token'
// 管理后台独立 token 的 key（与前台隔离，避免互相干扰）
export const ADMIN_TOKEN_KEY = 'adminToken'

// 获取前台 token
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// 设置前台 token
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

// 移除前台 token
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// 获取管理后台 token
export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

// 设置管理后台 token
export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

// 移除管理后台 token
export function removeAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

// 根据请求 URL 判断使用前台还是后台 token
// 约定：/admin 开头的接口使用 adminToken，其余使用前台 token
function pickToken(url: string): string | null {
  // url 是相对于 baseURL('/api') 的路径，如 '/admin/stats' 或 '/auth/login'
  const normalized = url.startsWith('/') ? url : `/${url}`
  if (normalized.startsWith('/admin')) {
    return getAdminToken()
  }
  return getToken()
}

// ==================== 请求拦截器 ====================
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 优先使用配置中显式指定的 token，否则按 URL 前缀自动选择
    const url = config.url || ''
    const token = pickToken(url)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ==================== 响应拦截器 ====================
service.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse

    // 非 ApiResponse 结构（如直接返回文件流），原样返回
    if (res === null || typeof res !== 'object' || typeof res.code === 'undefined') {
      return response.data
    }

    // code: 0=成功
    if (res.code === 0) {
      return res.data
    }

    // code: 2=未认证，清理 token 并跳转对应登录页
    if (res.code === 2) {
      // 动态导入 router 避免循环依赖；兜底使用 location
      import('@/router')
        .then(({ default: router }) => {
          const current = router.currentRoute.value.fullPath
          // 管理后台路由失效 → 清除后台 token 并跳转管理后台登录页
          if (current.startsWith('/admin') && !current.startsWith('/admin/login')) {
            removeAdminToken()
            localStorage.removeItem('adminUser')
            router.replace({ path: '/admin/login', query: { redirect: current } })
          } else if (!current.startsWith('/login') && !current.startsWith('/admin/login')) {
            // 前台路由失效 → 清除前台 token 并跳转前台登录页
            removeToken()
            localStorage.removeItem('user')
            router.replace({ path: '/login', query: { redirect: current } })
          }
        })
        .catch(() => {
          window.location.href = '/login'
        })
      return Promise.reject(new Error(res.message || '登录已失效，请重新登录'))
    }

    // 其他业务错误码统一抛错
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    // 网络层错误
    let message = '网络异常，请稍后重试'
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      if (data?.message) {
        message = data.message
      } else if (status === 401) {
        message = '登录已失效，请重新登录'
        // 根据请求 URL 决定清除哪个 token
        const reqUrl = error.config?.url || ''
        if (reqUrl.includes('/admin')) {
          removeAdminToken()
          localStorage.removeItem('adminUser')
        } else {
          removeToken()
          localStorage.removeItem('user')
        }
      } else if (status === 403) {
        message = '没有权限访问'
      } else if (status === 404) {
        message = '请求的资源不存在'
      } else if (status >= 500) {
        message = '服务器错误，请稍后重试'
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时，请稍后重试'
    }
    return Promise.reject(new Error(message))
  },
)

// ==================== 请求方法封装 ====================

/**
 * GET 请求
 * @param url 请求地址
 * @param params 查询参数
 * @param config 额外配置
 */
export function get<T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig,
): Promise<T> {
  return service.get(url, { params, ...config }) as unknown as Promise<T>
}

/**
 * POST 请求
 * @param url 请求地址
 * @param data 请求体
 * @param config 额外配置
 */
export function post<T = unknown>(
  url: string,
  data?: Record<string, unknown> | unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return service.post(url, data, config) as unknown as Promise<T>
}

/**
 * PUT 请求
 * @param url 请求地址
 * @param data 请求体
 * @param config 额外配置
 */
export function put<T = unknown>(
  url: string,
  data?: Record<string, unknown> | unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return service.put(url, data, config) as unknown as Promise<T>
}

/**
 * DELETE 请求
 * @param url 请求地址
 * @param params 查询参数
 * @param config 额外配置
 */
export function del<T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig,
): Promise<T> {
  return service.delete(url, { params, ...config }) as unknown as Promise<T>
}

export default service
