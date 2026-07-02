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
        @click="openCreate"
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
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">书名</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">作者</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">出版社</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">课程</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-if="!list.length">
              <td colspan="5" class="px-6 py-12 text-center text-sm text-gray-400">暂无教材数据</td>
            </tr>
            <tr v-for="item in list" :key="item.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ item.title }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ item.author }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ item.publisher }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                {{ item.course?.name || '-' }}
                <span v-if="item.class" class="text-xs text-gray-400">（{{ item.class.name }}）</span>
              </td>
              <td class="px-6 py-4 text-right text-sm space-x-2 whitespace-nowrap">
                <button type="button" class="text-primary-600 hover:text-primary-700 font-medium" @click="openEdit(item)">编辑</button>
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

    <!-- 新增/编辑弹窗 -->
    <Modal :show="formModal.show" :title="formModal.isEdit ? '编辑教材' : '新增教材'" @close="closeForm">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">书名 *</label>
          <input
            v-model="formModal.form.title"
            type="text"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">作者 *</label>
            <input
              v-model="formModal.form.author"
              type="text"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">出版社</label>
            <input
              v-model="formModal.form.publisher"
              type="text"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ISBN</label>
            <input
              v-model="formModal.form.isbn"
              type="text"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">价格</label>
            <input
              v-model.number="formModal.form.price"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">所属课程 *</label>
          <select
            v-model="formModal.form.courseId"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">请选择课程</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">
              {{ c.name }}（{{ c.semester?.name || '无学期' }}）
            </option>
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
      <template #footer>
        <button type="button" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200" @click="closeForm">取消</button>
        <button type="button" class="px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600" @click="submitForm">
          {{ formModal.isEdit ? '保存' : '创建' }}
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
import type { Textbook, Course, Semester, PaginatedResponse } from '@/types'

interface AdminCourse extends Course {
  semester?: Semester
}

const list = ref<Textbook[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(true)
const error = ref('')

const courses = ref<AdminCourse[]>([])

async function fetchList() {
  loading.value = true
  error.value = ''
  try {
    const res = await get<PaginatedResponse<Textbook>>('/admin/textbooks', {
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

async function fetchCourses() {
  try {
    courses.value = await get<AdminCourse[]>('/admin/courses')
  } catch {
    courses.value = []
  }
}

function handlePageChange(p: number) {
  page.value = p
  fetchList()
}

// ==================== 新增/编辑 ====================
interface TextbookForm {
  id?: string
  title: string
  author: string
  publisher: string
  isbn: string
  price: number
  courseId: string
  coverImage: string
}

const formModal = ref<{ show: boolean; isEdit: boolean; form: TextbookForm }>({
  show: false,
  isEdit: false,
  form: emptyForm(),
})

function emptyForm(): TextbookForm {
  return { title: '', author: '', publisher: '', isbn: '', price: 0, courseId: '', coverImage: '' }
}

function openCreate() {
  formModal.value = { show: true, isEdit: false, form: emptyForm() }
  if (!courses.value.length) fetchCourses()
}

function openEdit(item: Textbook) {
  formModal.value = {
    show: true,
    isEdit: true,
    form: {
      id: item.id,
      title: item.title,
      author: item.author,
      publisher: item.publisher,
      isbn: item.isbn,
      price: item.price,
      courseId: item.courseId,
      coverImage: item.coverImage || '',
    },
  }
  if (!courses.value.length) fetchCourses()
}

function closeForm() {
  formModal.value.show = false
}

async function submitForm() {
  const f = formModal.value.form
  if (!f.title || !f.author || !f.courseId) {
    error.value = '书名、作者、课程为必填'
    return
  }
  try {
    if (formModal.value.isEdit && f.id) {
      await put(`/admin/textbooks/${f.id}`, {
        title: f.title,
        author: f.author,
        publisher: f.publisher,
        isbn: f.isbn,
        price: f.price,
        courseId: f.courseId,
        coverImage: f.coverImage || null,
      })
    } else {
      await post('/admin/textbooks', {
        title: f.title,
        author: f.author,
        publisher: f.publisher,
        isbn: f.isbn,
        price: f.price,
        courseId: f.courseId,
        coverImage: f.coverImage || null,
      })
    }
    await fetchList()
    closeForm()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  }
}

async function handleDelete(item: Textbook) {
  if (!confirm(`确认删除教材「${item.title}」吗？`)) return
  try {
    await del(`/admin/textbooks/${item.id}`)
    await fetchList()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  }
}

onMounted(() => {
  fetchList()
  fetchCourses()
})
</script>
