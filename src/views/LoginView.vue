<template>
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-slate-900">欢迎回来</h1>
      <p class="mt-2 text-slate-500">登录以访问教材管理系统</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="mb-4 px-4 py-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
      <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
        <input
          v-model="form.email"
          type="email"
          autocomplete="email"
          class="input-field"
          placeholder="请输入邮箱"
          :disabled="loading"
        />
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-sm font-medium text-slate-700">密码</label>
          <RouterLink to="/forgot-password" class="text-sm text-primary-600 hover:text-primary-700">
            忘记密码?
          </RouterLink>
        </div>
        <div class="relative">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            class="input-field pr-11"
            placeholder="请输入密码"
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
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

      <button type="submit" class="btn-primary w-full" :disabled="loading">
        <span v-if="loading" class="inline-flex items-center gap-2">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
          </svg>
          登录中...
        </span>
        <span v-else>登录</span>
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      还没有账号?
      <RouterLink to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
        立即注册
      </RouterLink>
    </p>

    <!-- 管理后台入口 -->
    <div class="mt-6 pt-5 border-t border-slate-100 text-center">
      <RouterLink to="/admin/login" class="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        管理员登录入口
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function handleLogin() {
  error.value = ''

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
    const data = await authStore.login(form.value.email, form.value.password)

    // 前台登录页仅处理普通用户登录
    // 管理员账号请通过 /admin/login 登录管理后台
    if (data.user.role === 'ADMIN') {
      // 管理员账号不应在前台登录页保留登录态
      authStore.clearAuth()
      error.value = '管理员账号请通过管理后台登录入口登录'
      return
    }

    // 普通用户跳转到来源页或首页
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: any) {
    error.value = err.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>
