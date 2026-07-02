<script setup lang="ts">
// 邮箱验证页
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get } from '@/utils/request'

const route = useRoute()
const router = useRouter()
const status = ref<'loading' | 'success' | 'error'>('loading')
const message = ref('')

onMounted(async () => {
  const token = route.query.token as string
  if (!token) {
    status.value = 'error'
    message.value = '验证链接无效'
    return
  }

  try {
    await get('/auth/verify-email', { token })
    status.value = 'success'
    message.value = '邮箱验证成功，您现在可以正常使用所有功能了'
  } catch (e: any) {
    status.value = 'error'
    message.value = e.message || '验证失败，链接可能已过期'
  }
})

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-12">
    <div class="bg-white rounded-lg shadow-sm p-8 text-center">
      <!-- 加载中 -->
      <div v-if="status === 'loading'" class="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4" />

      <!-- 成功 -->
      <div v-else-if="status === 'success'">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-800 mb-2">验证成功</h2>
        <p class="text-gray-600 mb-6">{{ message }}</p>
      </div>

      <!-- 失败 -->
      <div v-else>
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-800 mb-2">验证失败</h2>
        <p class="text-gray-600 mb-6">{{ message }}</p>
      </div>

      <button
        @click="goHome"
        class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        返回首页
      </button>
    </div>
  </div>
</template>
