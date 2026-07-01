// 认证状态管理
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { get, post, getToken, setToken, removeToken } from '@/utils/request'
import type { LoginForm, RegisterForm, User, LoginResult } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // ==================== State ====================
  /** 用户信息 */
  const user = ref<User | null>(null)
  /** token（与 localStorage 同步） */
  const token = ref<string | null>(getToken())

  // ==================== Getters ====================
  /** 是否已登录 */
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  /** 用户角色 */
  const userRole = computed(() => user.value?.role ?? null)
  /** 用户积分 */
  const userPoints = computed(() => user.value?.points ?? 0)

  // ==================== Actions ====================

  /**
   * 设置 token 并同步到 localStorage
   */
  function setAuthToken(value: string) {
    token.value = value
    setToken(value)
  }

  /**
   * 清除 token 与用户信息
   */
  function clearAuth() {
    token.value = null
    user.value = null
    removeToken()
  }

  /**
   * 登录
   */
  async function login(email: string, password: string) {
    const data = await post<LoginResult>('/auth/login', { email, password } satisfies LoginForm)
    setAuthToken(data.token)
    user.value = data.user
    return data
  }

  /**
   * 注册
   */
  async function register(form: RegisterForm) {
    const data = await post<LoginResult>('/auth/register', form)
    setAuthToken(data.token)
    user.value = data.user
    return data
  }

  /**
   * 退出登录
   */
  async function logout() {
    try {
      await post('/auth/logout', {})
    } catch {
      // 即使接口失败也清除本地状态
    } finally {
      clearAuth()
    }
  }

  /**
   * 获取当前用户信息
   */
  async function fetchUser() {
    if (!token.value) return null
    const data = await get<User>('/auth/me')
    user.value = data
    return data
  }

  /**
   * 更新积分（本地增减，用于实时反馈）
   */
  function updatePoints(amount: number) {
    if (user.value) {
      user.value = { ...user.value, points: user.value.points + amount }
    }
  }

  return {
    // state
    user,
    token,
    // getters
    isAuthenticated,
    userRole,
    userPoints,
    // actions
    setAuthToken,
    clearAuth,
    login,
    register,
    logout,
    fetchUser,
    updatePoints,
  }
})
