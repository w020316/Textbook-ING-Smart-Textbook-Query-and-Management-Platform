<template>
  <nav v-if="totalPages > 1" class="flex items-center justify-center gap-1 sm:gap-2 select-none">
    <!-- 上一页 -->
    <button
      type="button"
      class="pagination-btn"
      :disabled="current <= 1"
      aria-label="上一页"
      @click="go(current - 1)"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      <span class="hidden sm:inline">上一页</span>
    </button>

    <!-- 页码：首页 + 省略号 -->
    <template v-if="showStartEllipsis">
      <button type="button" class="pagination-btn" @click="go(1)">1</button>
      <span class="px-1 text-slate-400">…</span>
    </template>

    <!-- 页码：可见区间 -->
    <button
      v-for="page in visiblePages"
      :key="page"
      type="button"
      class="pagination-btn"
      :class="page === current ? '!bg-primary-500 !text-white !border-primary-500' : ''"
      @click="go(page)"
    >
      {{ page }}
    </button>

    <!-- 页码：尾页 + 省略号 -->
    <template v-if="showEndEllipsis">
      <span class="px-1 text-slate-400">…</span>
      <button type="button" class="pagination-btn" @click="go(totalPages)">{{ totalPages }}</button>
    </template>

    <!-- 下一页 -->
    <button
      type="button"
      class="pagination-btn"
      :disabled="current >= totalPages"
      aria-label="下一页"
      @click="go(current + 1)"
    >
      <span class="hidden sm:inline">下一页</span>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    current: number
    total: number
    pageSize?: number
  }>(),
  {
    pageSize: 10,
  },
)

const emit = defineEmits<{
  (e: 'change', page: number): void
}>()

// 总页数
const totalPages = computed(() => {
  if (props.pageSize <= 0) return 1
  return Math.max(1, Math.ceil(props.total / props.pageSize))
})

// 可见页码（当前页前后各 2 页）
const visiblePages = computed(() => {
  const total = totalPages.value
  const current = props.current
  const pages: number[] = []

  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)

  // 靠近首页时右扩
  if (current <= 3) {
    end = Math.min(total, 5)
  }
  // 靠近尾页时左扩
  if (current >= total - 2) {
    start = Math.max(1, total - 4)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// 是否显示首部省略号
const showStartEllipsis = computed(() => {
  return totalPages.value > 5 && props.current > 3
})

// 是否显示尾部省略号
const showEndEllipsis = computed(() => {
  return totalPages.value > 5 && props.current < totalPages.value - 2
})

// 跳转到指定页
function go(page: number) {
  const target = Math.min(Math.max(1, page), totalPages.value)
  if (target === props.current) return
  emit('change', target)
}
</script>

<style scoped>
.pagination-btn {
  @apply inline-flex items-center gap-1 min-w-[2.25rem] h-9 px-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg transition-all hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-300;
}
</style>
