<template>
  <div class="space-y-6">
    <!-- 页面标题 + 新增按钮 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">新闻管理</h1>
        <p class="mt-1 text-sm text-gray-500">管理新闻资讯，包括新增、编辑、删除、置顶</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        @click="openCreate"
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
            <div class="flex items-center gap-2">
              <svg
                v-if="item.isPinned"
                class="w-3.5 h-3.5 text-amber-500 shrink-0"
                fill="currentColor" viewBox="0 0 20 20"
              >
                <path d="M9.828 1.172a4 4 0 00-5.656 0L3 2.343a4 4 0 000 5.656l3.172 3.172a4 4 0 005.656 0l1.172-1.171a4 4 0 000-5.656L9.828 1.172zM7.586 6.414L4.414 3.242a2 2 0 012.828-2.828l3.172 3.172a2 2 0 01-2.828 2.828z" />
              </svg>
              <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
            </div>
            <p class="mt-0.5 text-xs text-gray-400">{{ formatDate(item.createdAt) }}</p>
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
          <div class="w-40 shrink-0 text-right text-sm space-x-2 whitespace-nowrap">
            <button type="button" class="text-amber-600 hover:text-amber-700 font-medium" @click="togglePin(item)">
              {{ item.isPinned ? '取消置顶' : '置顶' }}
            </button>
            <button type="button" class="text-primary-600 hover:text-primary-700 font-medium" @click="openEdit(item)">编辑</button>
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

    <!-- 新增/编辑弹窗 -->
    <Modal :show="formModal.show" :title="formModal.isEdit ? '编辑新闻' : '新增新闻'" @close="closeForm">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">标题 *</label>
          <input
            v-model="formModal.form.title"
            type="text"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">分类 *</label>
            <select
              v-model="formModal.form.categoryId"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">请选择分类</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">封面图 URL</label>
            <input
              v-model="formModal.form.coverImage"
              type="text"
              placeholder="https://..."
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">摘要</label>
          <input
            v-model="formModal.form.summary"
            type="text"
            placeholder="一句话摘要"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">正文内容 *（支持 HTML）</label>
          <textarea
            v-model="formModal.form.content"
            rows="10"
            placeholder="支持 HTML 标签，如 <p>、<h3>、<strong>、<ul><li> 等"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
          />
          <p class="mt-1 text-xs text-gray-400">提示：内容会经过安全过滤（移除 script、事件处理器等）</p>
        </div>
      </div>
      <template #footer>
        <button type="button" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200" @click="closeForm">取消</button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="submitting"
          @click="submitForm"
        >
          <svg v-if="submitting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
          </svg>
          {{ submitting ? '保存中...' : (formModal.isEdit ? '保存' : '创建') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get, post, put, del } from '@/utils/request'
import Pagination from '@/components/Pagination.vue'
import Modal from '@/admin/components/Modal.vue'
import { useToast } from '@/admin/composables/useToast'
import type { News, NewsCategory, PaginatedResponse } from '@/types'

interface AdminNews extends Omit<News, 'author'> {
  author?: { name: string }
}

const toast = useToast()

const list = ref<AdminNews[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(true)
const error = ref('')
const submitting = ref(false)

const categories = ref<NewsCategory[]>([])

async function fetchList() {
  loading.value = true
  error.value = ''
  try {
    const res = await get<PaginatedResponse<AdminNews>>('/admin/news', {
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

async function fetchCategories() {
  try {
    categories.value = await get<NewsCategory[]>('/admin/categories')
  } catch {
    categories.value = []
  }
}

function handlePageChange(p: number) {
  page.value = p
  fetchList()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ==================== 置顶切换 ====================
async function togglePin(item: AdminNews) {
  submitting.value = true
  try {
    await put(`/admin/news/${item.id}/pin`)
    await fetchList()
    toast.success(item.isPinned ? '已取消置顶' : '已置顶')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '操作失败')
  } finally {
    submitting.value = false
  }
}

// ==================== 新增/编辑 ====================
interface NewsForm {
  id?: string
  title: string
  content: string
  summary: string
  categoryId: string
  coverImage: string
}

const formModal = ref<{ show: boolean; isEdit: boolean; form: NewsForm }>({
  show: false,
  isEdit: false,
  form: emptyForm(),
})

function emptyForm(): NewsForm {
  return { title: '', content: '', summary: '', categoryId: '', coverImage: '' }
}

function openCreate() {
  formModal.value = { show: true, isEdit: false, form: emptyForm() }
  if (!categories.value.length) fetchCategories()
}

function openEdit(item: AdminNews) {
  formModal.value = {
    show: true,
    isEdit: true,
    form: {
      id: item.id,
      title: item.title,
      content: item.content,
      summary: item.summary,
      categoryId: item.categoryId,
      coverImage: item.coverImage || '',
    },
  }
  if (!categories.value.length) fetchCategories()
}

function closeForm() {
  if (submitting.value) return
  formModal.value.show = false
}

async function submitForm() {
  const f = formModal.value.form
  if (!f.title || !f.content || !f.categoryId) {
    toast.warning('标题、内容、分类为必填')
    return
  }
  submitting.value = true
  try {
    if (formModal.value.isEdit && f.id) {
      await put(`/admin/news/${f.id}`, {
        title: f.title,
        content: f.content,
        summary: f.summary,
        categoryId: f.categoryId,
        coverImage: f.coverImage || null,
      })
      toast.success('新闻已更新')
    } else {
      await post('/admin/news', {
        title: f.title,
        content: f.content,
        summary: f.summary,
        categoryId: f.categoryId,
        coverImage: f.coverImage || null,
      })
      toast.success('新闻已创建')
    }
    await fetchList()
    closeForm()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(item: AdminNews) {
  if (!confirm(`确认删除新闻「${item.title}」吗？`)) return
  submitting.value = true
  try {
    await del(`/admin/news/${item.id}`)
    await fetchList()
    toast.success(`「${item.title}」已删除`)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '删除失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchList()
  fetchCategories()
})
</script>
