<template>
  <div class="max-w-4xl mx-auto">
    <!-- 返回链接 -->
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-4"
      @click="router.push('/news')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      返回新闻列表
    </button>

    <!-- 加载中 -->
    <div v-if="loading" class="text-center py-24 text-slate-400">
      <svg class="animate-spin w-8 h-8 mx-auto text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
      </svg>
      <p class="mt-3 text-sm">加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error || !detail" class="card py-24 text-center text-slate-400">
      <svg class="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="mt-3 text-sm">文章不存在或已删除</p>
      <button type="button" class="btn-secondary mt-5" @click="router.push('/news')">
        返回新闻列表
      </button>
    </div>

    <!-- 文章内容 -->
    <article v-else class="space-y-6">
      <!-- 文章头部 -->
      <header class="card p-6 sm:p-8">
        <!-- 分类标签 -->
        <div class="flex items-center gap-2 mb-4">
          <span v-if="detail.category" class="tag" :class="categoryClass">
            {{ detail.category.name }}
          </span>
          <span v-if="detail.isPinned" class="tag bg-red-50 text-red-600">置顶</span>
        </div>

        <!-- 标题 -->
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
          {{ detail.title }}
        </h1>

        <!-- 元信息 -->
        <div class="mt-4 flex items-center gap-4 flex-wrap text-sm text-slate-500">
          <span class="inline-flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ formatDate(detail.createdAt) }}
          </span>
          <span v-if="detail.author" class="inline-flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ detail.author.name }}
          </span>
          <span class="inline-flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {{ detail.viewCount }} 阅读
          </span>
        </div>
      </header>

      <!-- 正文 -->
      <div class="card p-6 sm:p-8">
        <div v-if="contentParagraphs.length" class="space-y-4">
          <p
            v-for="(para, i) in contentParagraphs"
            :key="i"
            class="text-slate-700 leading-relaxed whitespace-pre-wrap"
          >
            {{ para }}
          </p>
        </div>
        <p v-else class="text-slate-400 text-sm">暂无正文内容</p>
      </div>

      <!-- 评论区 -->
      <section class="card p-6 sm:p-8 space-y-5">
        <h2 class="text-lg font-semibold text-slate-900">评论 ({{ commentTotal }})</h2>

        <!-- 评论输入 -->
        <div v-if="auth.isAuthenticated" class="space-y-3">
          <textarea
            v-model="commentContent"
            rows="3"
            class="input-field resize-none"
            placeholder="写下你的评论..."
          ></textarea>
          <div class="flex justify-end">
            <button
              type="button"
              class="btn-primary"
              :disabled="!commentContent.trim() || submitting"
              @click="submitComment"
            >
              {{ submitting ? '发表中...' : '发表评论' }}
            </button>
          </div>
        </div>
        <div v-else class="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500 text-center">
          请先登录后评论
        </div>

        <!-- 评论列表 -->
        <div v-if="comments.length" class="space-y-4 divide-y divide-slate-100">
          <div v-for="c in comments" :key="c.id" class="flex gap-3 pt-4 first:pt-0">
            <!-- 头像 -->
            <img
              v-if="c.user?.avatar"
              :src="c.user.avatar"
              :alt="c.user.name"
              class="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <span
              v-else
              class="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white flex items-center justify-center text-sm font-medium shrink-0"
            >
              {{ avatarText(c.user?.name) }}
            </span>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-slate-900">{{ c.user?.name || '匿名用户' }}</span>
                <span class="text-xs text-slate-400">{{ formatDate(c.createdAt) }}</span>
              </div>
              <p class="mt-1 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{{ c.content }}</p>
            </div>
          </div>
        </div>
        <div v-else class="py-6 text-center text-sm text-slate-400">
          暂无评论，快来发表第一条评论吧
        </div>
      </section>

      <!-- 相关文章 -->
      <section v-if="relatedNews.length" class="card p-6 sm:p-8 space-y-4">
        <h2 class="text-lg font-semibold text-slate-900">相关文章</h2>
        <ul class="divide-y divide-slate-100">
          <li
            v-for="r in relatedNews"
            :key="r.id"
            class="group cursor-pointer py-3 first:pt-0 last:pb-0"
            @click="goDetail(r.id)"
          >
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-sm font-medium text-slate-700 group-hover:text-primary-600 transition-colors line-clamp-2">
                {{ r.title }}
              </h3>
              <span class="shrink-0 text-xs text-slate-400">{{ formatDate(r.createdAt) }}</span>
            </div>
          </li>
        </ul>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get, post } from '@/utils/request'
import { useAuthStore } from '@/stores/auth'
import type { News, Comment, PaginatedResponse } from '@/types'

// 详情接口额外返回 related 相关文章字段
type NewsDetail = News & { related?: News[] }

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// ==================== 文章数据 ====================
const newsId = computed(() => String(route.params.id))
const detail = ref<NewsDetail | null>(null)
const loading = ref(true)
const error = ref(false)

// ==================== 评论数据 ====================
const comments = ref<Comment[]>([])
const commentTotal = ref(0)
const commentContent = ref('')
const submitting = ref(false)

// 正文按段落拆分
const contentParagraphs = computed(() => {
  if (!detail.value?.content) return []
  return detail.value.content.split(/\n+/).filter((p) => p.trim())
})

// 相关文章
const relatedNews = computed(() => detail.value?.related ?? [])

// 分类标签颜色
const categoryClass = computed(() => {
  const slug = detail.value?.category?.slug || ''
  const map: Record<string, string> = {
    notice: 'bg-red-50 text-red-600',
    news: 'bg-primary-50 text-primary-700',
    activity: 'bg-emerald-50 text-emerald-700',
    exam: 'bg-amber-50 text-amber-700',
  }
  return map[slug] || 'bg-slate-100 text-slate-600'
})

// ==================== 数据加载 ====================
async function loadDetail() {
  loading.value = true
  error.value = false
  try {
    detail.value = await get<NewsDetail>(`/news/${newsId.value}`)
  } catch {
    detail.value = null
    error.value = true
  } finally {
    loading.value = false
  }
}

async function loadComments() {
  try {
    const res = await get<PaginatedResponse<Comment>>(
      `/news/${newsId.value}/comments`,
      { page: 1, pageSize: 50 },
    )
    comments.value = res.list
    commentTotal.value = res.total
  } catch {
    comments.value = []
    commentTotal.value = 0
  }
}

async function submitComment() {
  const content = commentContent.value.trim()
  if (!content || submitting.value) return
  submitting.value = true
  try {
    await post(`/news/${newsId.value}/comments`, { content })
    commentContent.value = ''
    await loadComments()
  } catch {
    // 错误已由请求拦截器统一提示
  } finally {
    submitting.value = false
  }
}

// ==================== 导航 ====================
function goDetail(id: string) {
  router.push(`/news/${id}`)
}

// 切换相关文章时重新加载
watch(newsId, () => {
  loadDetail()
  loadComments()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

// ==================== 工具函数 ====================
function avatarText(name?: string): string {
  return name ? name.charAt(0).toUpperCase() : 'U'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ==================== 初始化 ====================
onMounted(() => {
  loadDetail()
  loadComments()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
