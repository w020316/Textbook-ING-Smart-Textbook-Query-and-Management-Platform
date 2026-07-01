<template>
  <article
    class="card cursor-pointer p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
    @click="goDetail"
  >
    <!-- 顶部：分类标签 + 置顶标记 -->
    <div class="flex items-center gap-2 mb-3">
      <span
        v-if="news.category"
        class="tag"
        :class="categoryClass"
      >
        {{ news.category.name }}
      </span>
      <span v-if="news.isPinned" class="tag bg-red-50 text-red-600">
        置顶
      </span>
    </div>

    <!-- 封面图（可选） -->
    <div v-if="news.coverImage" class="mb-3 overflow-hidden rounded-lg">
      <img
        :src="news.coverImage"
        :alt="news.title"
        class="w-full h-40 object-cover transition-transform duration-300 hover:scale-105"
        loading="lazy"
      />
    </div>

    <!-- 标题 -->
    <h3 class="text-base font-semibold text-slate-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
      {{ news.title }}
    </h3>

    <!-- 摘要 -->
    <p class="text-sm text-slate-500 line-clamp-2 mb-3">
      {{ news.summary }}
    </p>

    <!-- 底部：日期 + 阅读数 -->
    <div class="flex items-center justify-between text-xs text-slate-400">
      <span>{{ formattedDate }}</span>
      <span class="inline-flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        {{ news.viewCount }}
      </span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { News } from '@/types'

const props = defineProps<{
  news: News
}>()

const router = useRouter()

// 跳转新闻详情
function goDetail() {
  router.push(`/news/${props.news.id}`)
}

// 格式化日期
const formattedDate = computed(() => {
  if (!props.news.createdAt) return ''
  const d = new Date(props.news.createdAt)
  if (Number.isNaN(d.getTime())) return props.news.createdAt
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

// 根据分类 slug 决定标签颜色
const categoryClass = computed(() => {
  const slug = props.news.category?.slug || ''
  const colorMap: Record<string, string> = {
    notice: 'bg-red-50 text-red-600',
    news: 'bg-primary-50 text-primary-700',
    activity: 'bg-emerald-50 text-emerald-700',
    exam: 'bg-amber-50 text-amber-700',
  }
  return colorMap[slug] || 'bg-slate-100 text-slate-600'
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
