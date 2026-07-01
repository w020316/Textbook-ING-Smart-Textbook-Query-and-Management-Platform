<template>
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-slate-900">重置密码</h1>
      <p class="mt-2 text-slate-500">请输入注册邮箱，我们将发送验证码</p>
    </div>

    <div v-if="error" class="mb-4 px-4 py-3 bg-red-50 text-red-600 rounded-lg text-sm">
      {{ error }}
    </div>
    <div v-if="success" class="mb-4 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm">
      {{ success }}
    </div>

    <form @submit.prevent="handleReset" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
        <input v-model="form.email" type="email" class="input-field" placeholder="请输入注册邮箱" :disabled="loading" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">验证码</label>
        <div class="flex gap-3">
          <input v-model="form.code" type="text" maxlength="6" class="input-field flex-1" placeholder="请输入验证码" :disabled="loading" />
          <button type="button" class="btn-secondary whitespace-nowrap" :disabled="countdown > 0 || sendingCode" @click="sendCode">
            {{ countdown > 0 ? `${countdown}s后重发` : (sendingCode ? '发送中...' : '发送验证码') }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">新密码</label>
        <input v-model="form.newPassword" type="password" class="input-field" placeholder="至少6位新密码" :disabled="loading" />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">确认密码</label>
        <input v-model="confirmPassword" type="password" class="input-field" placeholder="请再次输入新密码" :disabled="loading" />
      </div>

      <button type="submit" class="btn-primary w-full" :disabled="loading">
        {{ loading ? '重置中...' : '重置密码' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      <RouterLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">返回登录</RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { post } from '@/utils/request'

const router = useRouter()

const form = ref({ email: '', code: '', newPassword: '' })
const confirmPassword = ref('')
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const error = ref('')
const success = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function startCountdown() {
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (timer) clearInterval(timer)
      timer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

async function sendCode() {
  error.value = ''
  success.value = ''

  if (!form.value.email) {
    error.value = '请先输入邮箱'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    error.value = '邮箱格式不正确'
    return
  }

  sendingCode.value = true
  try {
    const res = await post<{ code?: string }>('/auth/forgot-password', { email: form.value.email })
    startCountdown()
    if (res.code) {
      form.value.code = res.code
      success.value = `验证码已发送（开发环境：${res.code}）`
    } else {
      success.value = '重置验证码已发送至邮箱，请查收'
    }
  } catch (err: any) {
    error.value = err.message || '验证码发送失败'
  } finally {
    sendingCode.value = false
  }
}

async function handleReset() {
  error.value = ''
  success.value = ''

  if (!form.value.email || !form.value.code || !form.value.newPassword) {
    error.value = '请填写完整信息'
    return
  }
  if (form.value.newPassword.length < 6) {
    error.value = '密码长度至少6位'
    return
  }
  if (form.value.newPassword !== confirmPassword.value) {
    error.value = '两次密码不一致'
    return
  }

  loading.value = true
  try {
    await post('/auth/reset-password', {
      email: form.value.email,
      code: form.value.code,
      newPassword: form.value.newPassword,
    })
    success.value = '密码重置成功，正在跳转登录页...'
    setTimeout(() => router.push('/login'), 1500)
  } catch (err: any) {
    error.value = err.message || '重置失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>
