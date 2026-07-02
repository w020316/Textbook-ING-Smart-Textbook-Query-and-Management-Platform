<template>
  <div class="space-y-6">
    <!-- 页面标题 + 新增按钮 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">校历管理</h1>
        <p class="mt-1 text-sm text-gray-500">管理学期信息与教学周安排</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        @click="openCreate"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新增学期
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
      <!-- 学期列表 -->
      <div class="space-y-4">
        <div
          v-if="!list.length"
          class="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400"
        >
          暂无学期数据
        </div>

        <div
          v-for="item in list"
          :key="item.id"
          class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <!-- 左侧信息 -->
            <div class="flex-1 min-w-[240px]">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-base font-semibold text-gray-900">{{ item.name }}</h3>
                <span
                  v-if="item.isActive"
                  class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-600 font-medium"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  当前学期
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-500">
                {{ formatDate(item.startDate) }} ~ {{ formatDate(item.endDate) }} · 共 {{ item.totalWeeks }} 周
              </p>
            </div>

            <!-- 右侧操作 -->
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-if="!item.isActive"
                type="button"
                class="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                @click="setActive(item)"
              >
                设为当前
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
                @click="generateWeeks(item)"
              >
                生成教学周
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100"
                @click="openEdit(item)"
              >
                编辑
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                @click="handleDelete(item)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 新增/编辑弹窗 -->
    <Modal :show="formModal.show" :title="formModal.isEdit ? '编辑学期' : '新增学期'" @close="closeForm">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">学期名称 *</label>
          <input
            v-model="formModal.form.name"
            type="text"
            placeholder="例如：2025-2026学年第一学期"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">开始日期 *</label>
            <input
              v-model="formModal.form.startDate"
              type="date"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">结束日期 *</label>
            <input
              v-model="formModal.form.endDate"
              type="date"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">总周数</label>
          <input
            v-model.number="formModal.form.totalWeeks"
            type="number"
            min="1"
            max="30"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div v-if="formModal.isEdit" class="flex items-center gap-2">
          <input
            :id="`active-${formModal.form.id}`"
            v-model="formModal.form.isActive"
            type="checkbox"
            class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label :for="`active-${formModal.form.id}`" class="text-sm text-gray-700">设为当前学期</label>
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
import Modal from '@/admin/components/Modal.vue'
import type { Semester } from '@/types'

const list = ref<Semester[]>([])
const loading = ref(true)
const error = ref('')

async function fetchList() {
  loading.value = true
  error.value = ''
  try {
    list.value = await get<Semester[]>('/admin/semesters')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载学期列表失败'
    list.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// ==================== 新增/编辑 ====================
interface SemesterForm {
  id?: string
  name: string
  startDate: string
  endDate: string
  totalWeeks: number
  isActive: boolean
}

const formModal = ref<{ show: boolean; isEdit: boolean; form: SemesterForm }>({
  show: false,
  isEdit: false,
  form: { name: '', startDate: '', endDate: '', totalWeeks: 20, isActive: false },
})

function openCreate() {
  formModal.value = {
    show: true,
    isEdit: false,
    form: { name: '', startDate: '', endDate: '', totalWeeks: 20, isActive: false },
  }
}

function openEdit(item: Semester) {
  formModal.value = {
    show: true,
    isEdit: true,
    form: {
      id: item.id,
      name: item.name,
      startDate: item.startDate.slice(0, 10),
      endDate: item.endDate.slice(0, 10),
      totalWeeks: item.totalWeeks,
      isActive: item.isActive,
    },
  }
}

function closeForm() {
  formModal.value.show = false
}

async function submitForm() {
  const f = formModal.value.form
  if (!f.name || !f.startDate || !f.endDate) {
    error.value = '名称、开始/结束日期为必填'
    return
  }
  try {
    if (formModal.value.isEdit && f.id) {
      await put(`/admin/semesters/${f.id}`, {
        name: f.name,
        startDate: f.startDate,
        endDate: f.endDate,
        totalWeeks: f.totalWeeks,
        isActive: f.isActive,
      })
    } else {
      await post('/admin/semesters', {
        name: f.name,
        startDate: f.startDate,
        endDate: f.endDate,
        totalWeeks: f.totalWeeks,
      })
    }
    await fetchList()
    closeForm()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  }
}

// ==================== 设为当前学期 ====================
async function setActive(item: Semester) {
  if (!confirm(`确认将「${item.name}」设为当前学期吗？`)) return
  try {
    await put(`/admin/semesters/${item.id}`, { isActive: true })
    await fetchList()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '设置失败'
  }
}

// ==================== 生成教学周 ====================
async function generateWeeks(item: Semester) {
  if (!confirm(`将为「${item.name}」生成 ${item.totalWeeks} 周教学周（会覆盖已有数据），继续吗？`)) return
  try {
    await post('/admin/semesters/weeks/batch', { semesterId: item.id })
    alert('教学周已生成')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '生成教学周失败'
  }
}

// ==================== 删除 ====================
async function handleDelete(item: Semester) {
  if (!confirm(`确认删除学期「${item.name}」吗？相关教学周将一并删除。`)) return
  try {
    await del(`/admin/semesters/${item.id}`)
    await fetchList()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  }
}

onMounted(fetchList)
</script>
