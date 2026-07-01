// 应用全局状态管理
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get } from '@/utils/request'
import type { Stats, Message, HotSearch } from '@/types'

export const useAppStore = defineStore('app', () => {
  // ==================== State ====================
  /** 首页统计数据 */
  const stats = ref<Stats>({
    semesterCount: 0,
    textbookCount: 0,
    userCount: 0,
    collegeCount: 0,
  })
  /** 未读消息数 */
  const unreadMessages = ref(0)
  /** 热门搜索词列表 */
  const hotSearches = ref<HotSearch[]>([])

  // ==================== Actions ====================

  /**
   * 获取首页统计数据
   */
  async function fetchStats() {
    try {
      const data = await get<Stats>('/stats')
      stats.value = data
    } catch {
      // 接口失败保留默认值
    }
  }

  /**
   * 获取未读消息数
   */
  async function fetchUnreadMessages() {
    try {
      const data = await get<{ count: number }>('/messages/unread-count')
      unreadMessages.value = data.count
    } catch {
      // 接口失败保留默认值
    }
  }

  /**
   * 获取热门搜索词
   */
  async function fetchHotSearches() {
    try {
      const data = await get<HotSearch[]>('/hot-searches')
      hotSearches.value = data
    } catch {
      // 接口失败保留默认值
    }
  }

  return {
    // state
    stats,
    unreadMessages,
    hotSearches,
    // actions
    fetchStats,
    fetchUnreadMessages,
    fetchHotSearches,
  }
})
