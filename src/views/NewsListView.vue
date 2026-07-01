<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900">新闻中心</h1>
      <p class="mt-1 text-sm text-slate-500">获取最新校园资讯、通知公告和活动信息</p>
    </div>

    <!-- 分类标签栏 -->
    <div class="card p-3">
      <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          type="button"
          class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
          :class="activeCategory === '' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 hover:bg-primary-50 hover:text-primary-600'"
          @click="switchCategory('')"
        >
          全部
        </button>
        <button
          v-for="c in categories"
          :key="c.id"
          type="button"
          class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
          :class="activeCategory === c.id ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 hover:bg-primary-50 hover:text-primary-600'"
          @click="switchCategory(c.id)"
        >
          {{ c.name }}
        </button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="text-center py-20 text-slate-400">
      <svg class="animate-spin w-8 h-8 mx-auto text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
      </svg>
      <p class="mt-3 text-sm">加载中...</p>
    </div>

    <template v-else>
      <!-- 空状态 -->
      <div v-if="!allNews.length" class="card py-20 text-center text-slate-400">
        <svg class="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 0a2 2 0 012 2v8a2 2 0 01-2 2m0-12V6m0 0V4a2 2 0 00-2-2h-2m4 8h-4a2 2 0 00-2 2v0a2 2 0 002 2h4a2 2 0 002-2v0a2 2 0 00-2-2z" />
        </svg>
        <p class="mt-3 text-sm">该分类暂无文章</p>
      </div>

      <template v-else>
        <!-- 置顶推荐区 -->
        <section v-if="pinnedNews.length" class="space-y-3">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 8a1 1 0 011-1h12a1 1 0 110 2h-5v3a1 1 0 11-2 0v-3H4a1 1 0 01-1-1z" />
            </svg>
            <h2 class="text-lg font-semibold text-slate-900">置顶推荐</h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <NewsCard v-for="n in pinnedNews" :key="n.id" :news="n" />
          </div>
        </section>

        <!-- 新闻列表 -->
        <section class="space-y-3">
          <div v-if="pinnedNews.length" class="flex items-center gap-2">
            <h2 class="text-lg font-semibold text-slate-900">全部文章</h2>
            <span class="text-sm text-slate-400">共 {{ total }} 篇</span>
          </div>
          <div v-if="regularNews.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <NewsCard v-for="n in regularNews" :key="n.id" :news="n" />
          </div>
          <div v-else class="card py-12 text-center text-slate-400">
            <p class="text-sm">该分类暂无文章</p>
          </div>

          <Pagination
            :current="page"
            :total="total"
            :page-size="pageSize"
            @change="handlePageChange"
          />
        </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { get } from '@/utils/request'
import Pagination from '@/components/Pagination.vue'
import NewsCard from '@/components/NewsCard.vue'
import type { News, NewsCategory, PaginatedResponse } from '@/types'

// ==================== 分类数据 ====================
const categories = ref<NewsCategory[]>([])
const activeCategory = ref('')

// ==================== 列表数据 ====================
const allNews = ref<News[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(true)

// 置顶与非置顶拆分（避免重复展示）
const pinnedNews = computed(() => allNews.value.filter((n) => n.isPinned))
const regularNews = computed(() => allNews.value.filter((n) => !n.isPinned))

// ==================== 数据加载 ====================
async function loadCategories() {
  try {
    categories.value = await get<NewsCategory[]>('/news/categories')
  } catch {
    categories.value = []
  }
}

async function loadNews() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, pageSize: pageSize.value }
    if (activeCategory.value) params.categoryId = activeCategory.value
    const res = await get<PaginatedResponse<News>>('/news', params)
    allNews.value = res.list
    total.value = res.total
  } catch {
    allNews.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// ==================== 交互处理 ====================
function switchCategory(id: string) {
  if (activeCategory.value === id) return
  activeCategory.value = id
  page.value = 1
  loadNews()
}

function handlePageChange(p: number) {
  page.value = p
  loadNews()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ==================== 初始化 ====================
onMounted(async () => {
  await loadCategories()
  await loadNews()
})
</script>
