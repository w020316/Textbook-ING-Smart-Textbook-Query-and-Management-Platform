<script setup lang="ts">
// 个人中心页 - 用户信息 + 积分明细 + 消息中心 + 签到
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { get, post } from '@/utils/request'
import Breadcrumb from '@/components/Breadcrumb.vue'
import Skeleton from '@/components/Skeleton.vue'

const authStore = useAuthStore()

const activeTab = ref<'info' | 'points' | 'messages'>('info')
const loading = ref(false)
const pointsBalance = ref(0)
const pointsRecords = ref<any[]>([])
const messages = ref<any[]>([])
const unreadCount = ref(0)
const checkInLoading = ref(false)
const checkInMsg = ref('')

async function loadData() {
  loading.value = true
  try {
    const [balance, records, msgs] = await Promise.all([
      get<{ points: number }>('/points/balance'),
      get<{ list: any[] }>('/points/records', { page: 1, pageSize: 20 }),
      get<{ list: any[] }>('/messages', { page: 1, pageSize: 10 }),
    ])
    pointsBalance.value = balance.points
    pointsRecords.value = records.list
    messages.value = msgs.list
    unreadCount.value = msgs.list.filter((m: any) => !m.isRead).length
  } catch (e: any) {
    console.error('加载失败:', e.message)
  } finally {
    loading.value = false
  }
}

async function handleCheckIn() {
  checkInLoading.value = true
  checkInMsg.value = ''
  try {
    const res = await post<{ reward: number; balance: number }>('/user/check-in')
    pointsBalance.value = res.balance
    checkInMsg.value = `签到成功！获得 ${res.reward} 积分`
    // 重新加载积分记录
    const records = await get<{ list: any[] }>('/points/records', { page: 1, pageSize: 20 })
    pointsRecords.value = records.list
  } catch (e: any) {
    checkInMsg.value = e.message || '签到失败'
  } finally {
    checkInLoading.value = false
  }
}

async function markRead(id: string) {
  try {
    import('@/utils/request').then(({ put }) => put(`/messages/${id}/read`))
    const msg = messages.value.find(m => m.id === id)
    if (msg) {
      msg.isRead = true
      unreadCount.value = messages.value.filter(m => !m.isRead).length
    }
  } catch (e: any) {
    console.error('标记失败:', e.message)
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(loadData)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <Breadcrumb />

    <!-- 用户信息卡片 -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold">
            {{ authStore.user?.name?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">{{ authStore.user?.name }}</h2>
            <p class="text-gray-500 text-sm">{{ authStore.user?.email }}</p>
            <p class="text-primary-600 text-sm font-medium mt-1">积分：{{ pointsBalance }}</p>
          </div>
        </div>
        <button
          @click="handleCheckIn"
          :disabled="checkInLoading"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {{ checkInLoading ? '签到中...' : '每日签到' }}
        </button>
      </div>
      <p v-if="checkInMsg" class="mt-3 text-sm" :class="checkInMsg.includes('成功') ? 'text-green-600' : 'text-red-500'">
        {{ checkInMsg }}
      </p>
    </div>

    <!-- 标签页 -->
    <div class="bg-white rounded-lg shadow-sm">
      <div class="flex border-b">
        <button
          v-for="tab in [
            { key: 'info', label: '积分明细' },
            { key: 'points', label: '积分记录' },
            { key: 'messages', label: `消息中心${unreadCount ? ` (${unreadCount})` : ''}` },
          ]"
          :key="tab.key"
          @click="activeTab = tab.key as any"
          :class="[
            'px-6 py-3 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="p-6">
        <Skeleton v-if="loading" :lines="5" />

        <div v-else-if="activeTab === 'info' || activeTab === 'points'">
          <div v-if="pointsRecords.length === 0" class="text-center text-gray-400 py-8">
            暂无积分记录
          </div>
          <ul v-else class="space-y-3">
            <li
              v-for="record in pointsRecords"
              :key="record.id"
              class="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div>
                <p class="text-gray-700">{{ record.reason }}</p>
                <p class="text-gray-400 text-xs">{{ formatDate(record.createdAt) }}</p>
              </div>
              <span :class="record.amount > 0 ? 'text-green-600' : 'text-red-500'" class="font-medium">
                {{ record.amount > 0 ? '+' : '' }}{{ record.amount }}
              </span>
            </li>
          </ul>
        </div>

        <div v-else-if="activeTab === 'messages'">
          <div v-if="messages.length === 0" class="text-center text-gray-400 py-8">
            暂无消息
          </div>
          <ul v-else class="space-y-3">
            <li
              v-for="msg in messages"
              :key="msg.id"
              class="flex items-start justify-between py-2 border-b last:border-0"
              :class="!msg.isRead ? 'bg-blue-50 -mx-2 px-2 rounded' : ''"
            >
              <div class="flex-1">
                <p class="text-gray-700 font-medium">{{ msg.title }}</p>
                <p class="text-gray-500 text-sm">{{ msg.content }}</p>
                <p class="text-gray-400 text-xs">{{ formatDate(msg.createdAt) }}</p>
              </div>
              <button
                v-if="!msg.isRead"
                @click="markRead(msg.id)"
                class="text-xs text-primary-600 hover:underline ml-2"
              >
                标记已读
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
