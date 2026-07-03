<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-12">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="relative w-full max-w-md">
      <!-- 头部 Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-lg shadow-primary-500/30">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">管理后台</h1>
        <p class="mt-2 text-sm text-gray-400">教材ING 智能教材查询与管理平台</p>
      </div>

      <!-- 表单卡片 -->
      <div class="bg-gray-800/70 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8">
        <!-- 错误提示 -->
        <div v-if="error" class="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-start gap-2">
          <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ error }}</span>
        </div>

        <!-- 成功提示（跳转中） -->
        <div v-if="success" class="mb-5 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm flex items-center gap-2">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
          </svg>
          <span>登录成功，正在跳转...</span>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- 邮箱 -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">管理员邮箱</label>
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="请输入管理员邮箱"
              :disabled="loading"
            />
          </div>

          <!-- 密码 -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">密码</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                class="w-full px-4 py-2.5 pr-11 bg-gray-900/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="请输入密码"
                :disabled="loading"
                @keyup.enter="handleLogin"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            class="w-full py-2.5 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white font-medium rounded-lg shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading || success"
          >
            <span v-if="loading" class="inline-flex items-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
              正在登录...
            </span>
            <span v-else-if="success">登录成功</span>
            <span v-else>管理员登录</span>
          </button>
        </form>

        <!-- 提示信息 -->
        <div class="mt-6 pt-5 border-t border-gray-700/50">
          <p class="text-xs text-gray-500 text-center">
            仅限管理员账号登录。普通用户请前往
            <RouterLink to="/login" class="text-primary-400 hover:text-primary-300 font-medium">前台登录</RouterLink>
          </p>
        </div>
      </div>

      <!-- 返回前台 -->
      <div class="mt-6 text-center">
        <RouterLink to="/" class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回前台首页
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAdminAuthStore } from '@/stores/adminAuth'

const router = useRouter()
const route = useRoute()
const adminAuthStore = useAdminAuthStore()

const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const success = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  error.value = ''

  // 表单校验
  if (!form.value.email || !form.value.password) {
    error.value = '请输入邮箱和密码'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    error.value = '邮箱格式不正确'
    return
  }

  loading.value = true
  try {
    // 使用管理后台独立 auth store（token 存储到 adminToken，与前台隔离）
    await adminAuthStore.login(form.value.email, form.value.password)

    // 管理员登录成功
    success.value = true
    const redirect = (route.query.redirect as string) || '/admin'
    // 短暂延迟以显示成功状态
    setTimeout(() => {
      router.push(redirect)
    }, 500)
  } catch (err: any) {
    error.value = err.message || '登录失败，请检查邮箱和密码'
  } finally {
    loading.value = false
  }
}
</script>
