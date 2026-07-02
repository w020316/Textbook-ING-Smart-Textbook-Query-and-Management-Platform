<template>
  <div class="space-y-6">
    <!-- 页面标题 + 新增按钮 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">新闻管理</h1>
        <p class="mt-1 text-sm text-gray-500">管理新闻资讯，包括新增、编辑、删除</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        @click="handleAdd"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新增新闻
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

    <template v-else>
      <!-- 列表 -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        <div v-if="!list.length" class="px-6 py-12 text-center text-sm text-gray-400">
          暂无新闻数据
        </div>
        <div
          v-for="item in list"
          :key="item.id"
          class="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
        >
          <!-- 标题 -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
          </div>
          <!-- 分类 -->
          <div class="hidden sm:block w-28 shrink-0">
            <span class="inline-flex px-2 py-0.5 text-xs rounded-full bg-primary-50 text-primary-600">
              {{ item.category?.name || '未分类' }}
            </span>
          </div>
          <!-- 阅读数 -->
          <div class="w-20 shrink-0 text-sm text-gray-500 text-right">
            {{ item.viewCount }} 阅读
          </div>
          <!-- 操作 -->
          <div class="w-24 shrink-0 text-right text-sm space-x-2 whitespace-nowrap">
            <button type="button" class="text-primary-600 hover:text-primary-700 font-medium" @click="handleEdit(item)">编辑</button>
            <button type="button" class="text-red-600 hover:text-red-700 font-medium" @click="handleDelete(item)">删除</button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <Pagination
        :current="page"
        :total="total"
        :page-size="pageSize"
        @change="handlePageChange"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get, del } from '@/utils/request'
import Pagination from '@/components/Pagination.vue'
import type { News, PaginatedResponse } from '@/types'

const list = ref<News[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(true)
const error = ref('')

async function fetchList() {
  loading.value = true
  error.value = ''
  try {
    const res = await get<PaginatedResponse<News>>('/news', {
      page: page.value,
      pageSize: pageSize.value,
    })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载新闻列表失败'
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(p: number) {
  page.value = p
  fetchList()
}

function handleAdd() {
  // 阶段2实现：新增新闻
}

function handleEdit(_item: News) {
  // 阶段2实现：编辑新闻
}

async function handleDelete(item: News) {
  if (!confirm(`确认删除新闻「${item.title}」吗？`)) return
  try {
    await del(`/news/${item.id}`)
    await fetchList()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  }
}

onMounted(fetchList)
</script>
