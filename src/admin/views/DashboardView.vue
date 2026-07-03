<template>
  <div class="space-y-6">
    <!-- 欢迎信息 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p class="mt-1 text-sm text-gray-500">
          欢迎回来，{{ adminAuthStore.user?.name || '管理员' }}
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
        :disabled="loading"
        @click="fetchStats"
      >
        <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{{ loading ? '加载中' : '刷新' }}</span>
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="flex flex-col items-center py-20 text-gray-400">
      <svg class="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
      </svg>
      <p class="mt-3 text-sm">加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
      {{ error }}
    </div>

    <!-- 数据卡片 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div
        v-for="card in cards"
        :key="card.label"
        class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">{{ card.label }}</p>
            <p class="mt-2 text-3xl font-bold text-gray-900">{{ card.value }}</p>
          </div>
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center"
            :class="card.bgClass"
          >
            <span class="w-6 h-6" v-html="card.icon"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get } from '@/utils/request'
import { useAdminAuthStore } from '@/stores/adminAuth'

const adminAuthStore = useAdminAuthStore()

// 后台统计数据结构
interface DashboardStats {
  counts: {
    users: number
    textbooks: number
    news: number
    colleges: number
  }
  registerTrend: { date: string; count: number }[]
  hotSearches: { id: string; keyword: string; count: number }[]
}

const stats = ref<DashboardStats>({
  counts: { users: 0, textbooks: 0, news: 0, colleges: 0 },
  registerTrend: [],
  hotSearches: [],
})
const loading = ref(true)
const error = ref('')

const cards = computed(() => [
  {
    label: '用户数',
    value: stats.value.counts.users,
    bgClass: 'bg-blue-50 text-blue-600',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-3-3.87"/></svg>`,
  },
  {
    label: '教材数',
    value: stats.value.counts.textbooks,
    bgClass: 'bg-emerald-50 text-emerald-600',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  },
  {
    label: '新闻数',
    value: stats.value.counts.news,
    bgClass: 'bg-amber-50 text-amber-600',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 0a2 2 0 012 2v8a2 2 0 01-2 2m0-12V6m0 0V4a2 2 0 00-2-2h-2m4 8h-4a2 2 0 00-2 2v0a2 2 0 002 2h4a2 2 0 002-2v0a2 2 0 00-2-2z"/></svg>`,
  },
  {
    label: '学院数',
    value: stats.value.counts.colleges,
    bgClass: 'bg-purple-50 text-purple-600',
    icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-4M9 7h6m-6 4h6m-6 4h4"/></svg>`,
  },
])

async function fetchStats() {
  loading.value = true
  error.value = ''
  try {
    const data = await get<DashboardStats>('/admin/stats')
    stats.value = data
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载统计数据失败'
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
</script>
