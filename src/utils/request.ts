// Axios HTTP 请求封装
import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types'

// baseURL：优先读取环境变量，默认 /api
const baseURL = import.meta.env.VITE_API_BASE || '/api'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// token 在 localStorage 中的 key
export const TOKEN_KEY = 'token'

// 获取 token
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// 设置 token
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

// 移除 token
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ==================== 请求拦截器 ====================
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
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

    // code: 2=未认证，清理 token 并跳转登录页
    if (res.code === 2) {
      removeToken()
      // 动态导入 router 避免循环依赖；兜底使用 location
      import('@/router')
        .then(({ default: router }) => {
          const current = router.currentRoute.value.fullPath
          if (!current.startsWith('/login')) {
            router.replace({ path: '/login', query: { redirect: current } })
          }
        })
        .catch(() => {
          window.location.href = '/#/login'
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
        removeToken()
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
