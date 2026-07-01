<template>
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-slate-900">欢迎回来</h1>
      <p class="mt-2 text-slate-500">登录以访问教材管理系统</p>
    </div>

    <div v-if="error" class="mb-4 px-4 py-3 bg-red-50 text-red-600 rounded-lg text-sm">
      {{ error }}
    </div>

    <form @submit.prevent="handleLogin" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
        <input
          v-model="form.email"
          type="email"
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
        <input
          v-model="form.password"
          type="password"
          class="input-field"
          placeholder="请输入密码"
          :disabled="loading"
        />
      </div>

      <button type="submit" class="btn-primary w-full" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      还没有账号?
      <RouterLink to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
        立即注册
      </RouterLink>
    </p>
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
    await authStore.login(form.value.email, form.value.password)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: any) {
    error.value = err.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>
