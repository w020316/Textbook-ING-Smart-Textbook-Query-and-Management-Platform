// 管理后台认证状态管理（与前台认证完全隔离）
// 使用独立的 localStorage key：adminToken / adminUser
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { post, getAdminToken, setAdminToken, removeAdminToken } from '@/utils/request'
import type { LoginForm, User, LoginResult } from '@/types'

const ADMIN_USER_KEY = 'adminUser'

export const useAdminAuthStore = defineStore('adminAuth', () => {
  // ==================== State ====================
  /** 管理员用户信息 */
  const user = ref<User | null>(restoreAdminUser())
  /** 管理后台 token（与 localStorage 同步） */
  const token = ref<string | null>(getAdminToken())

  // ==================== Getters ====================
  /** 是否已登录管理后台 */
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  /** 用户角色（应始终为 ADMIN） */
  const userRole = computed(() => user.value?.role ?? null)

  // ==================== Actions ====================

  /**
   * 从 localStorage 恢复管理员信息
   */
  function restoreAdminUser(): User | null {
    try {
      const raw = localStorage.getItem(ADMIN_USER_KEY)
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  }

  /**
   * 同步 user 到 localStorage（供路由守卫读取角色）
   */
  function persistUser() {
    if (user.value) {
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user.value))
    } else {
      localStorage.removeItem(ADMIN_USER_KEY)
    }
  }

  /**
   * 清除管理后台 token 与用户信息
   */
  function clearAuth() {
    token.value = null
    user.value = null
    removeAdminToken()
    localStorage.removeItem(ADMIN_USER_KEY)
  }

  /**
   * 管理员登录
   * 注意：调用 /auth/login 接口（同一登录端点），但将 token 存储到 adminToken
   */
  async function login(email: string, password: string) {
    const data = await post<LoginResult>('/auth/login', { email, password } satisfies LoginForm)
    // 校验是否为管理员
    if (data.user.role !== 'ADMIN') {
      // 非管理员账号禁止登录后台
      throw new Error('该账号无管理员权限，请使用管理员账号登录')
    }
    token.value = data.token
    setAdminToken(data.token)
    user.value = data.user
    persistUser()
    return data
  }

  /**
   * 管理员退出（仅清除后台登录态，不影响前台）
   */
  async function logout() {
    try {
      // 调用退出接口（请求拦截器会自动带上 adminToken）
      await post('/auth/logout', {})
    } catch {
      // 即使接口失败也清除本地状态
    } finally {
      clearAuth()
    }
  }

  return {
    // state
    user,
    token,
    // getters
    isAuthenticated,
    userRole,
    // actions
    clearAuth,
    login,
    logout,
  }
})
