<template>
  <div class="space-y-6">
    <!-- 页面标题 + 新增按钮 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">教材管理</h1>
        <p class="mt-1 text-sm text-gray-500">管理教材信息，包括新增、编辑、删除</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        @click="handleAdd"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新增教材
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
      <!-- 表格 -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">书名</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">作者</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">出版社</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-if="!list.length">
              <td colspan="4" class="px-6 py-12 text-center text-sm text-gray-400">暂无教材数据</td>
            </tr>
            <tr v-for="item in list" :key="item.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-900">{{ item.title }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ item.author }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ item.publisher }}</td>
              <td class="px-6 py-4 text-right text-sm space-x-2 whitespace-nowrap">
                <button type="button" class="text-primary-600 hover:text-primary-700 font-medium" @click="handleEdit(item)">编辑</button>
                <button type="button" class="text-red-600 hover:text-red-700 font-medium" @click="handleDelete(item)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
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
import type { Textbook, PaginatedResponse } from '@/types'

const list = ref<Textbook[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(true)
const error = ref('')

async function fetchList() {
  loading.value = true
  error.value = ''
  try {
    const res = await get<PaginatedResponse<Textbook>>('/textbooks', {
      page: page.value,
      pageSize: pageSize.value,
    })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载教材列表失败'
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
  // 阶段2实现：新增教材
}

function handleEdit(_item: Textbook) {
  // 阶段2实现：编辑教材
}

async function handleDelete(item: Textbook) {
  if (!confirm(`确认删除教材「${item.title}」吗？`)) return
  try {
    await del(`/textbooks/${item.id}`)
    await fetchList()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  }
}

onMounted(fetchList)
</script>
