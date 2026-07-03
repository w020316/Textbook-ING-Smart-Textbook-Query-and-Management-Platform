<template>
  <div class="space-y-6">
    <!-- 页面标题 + 新增学院 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">学院管理</h1>
        <p class="mt-1 text-sm text-gray-500">管理学院、专业、班级信息</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        @click="openCollegeCreate"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新增学院
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
      <div class="flex items-center justify-between">
        <span>{{ error }}</span>
        <button
          type="button"
          class="ml-4 px-3 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors shrink-0"
          @click="fetchList"
        >
          重试
        </button>
      </div>
    </div>

    <template v-else>
      <div v-if="!list.length" class="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
        暂无学院数据
      </div>

      <!-- 学院卡片列表 -->
      <div class="space-y-4">
        <div
          v-for="college in list"
          :key="college.id"
          class="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <!-- 学院行 -->
          <div class="flex items-center justify-between p-5 hover:bg-gray-50">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <button
                type="button"
                class="p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                @click="toggleCollege(college.id)"
              >
                <svg
                  class="w-4 h-4 transition-transform"
                  :class="expandedColleges.has(college.id) ? 'rotate-90' : ''"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div class="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                {{ college.name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-900 truncate">{{ college.name }}</p>
                <p class="text-xs text-gray-500">代码：{{ college.code }} · {{ college._count?.majors || 0 }} 个专业</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="px-2.5 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded hover:bg-primary-100"
                @click="openMajorCreate(college)"
              >
                加专业
              </button>
              <button
                type="button"
                class="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 rounded hover:bg-slate-100"
                @click="openCollegeEdit(college)"
              >
                编辑
              </button>
              <button
                type="button"
                class="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                @click="deleteCollege(college)"
              >
                删除
              </button>
            </div>
          </div>

          <!-- 专业列表（展开） -->
          <div v-if="expandedColleges.has(college.id)" class="border-t border-gray-100 bg-gray-50/50">
            <div v-if="!college.majors?.length" class="px-5 py-6 text-center text-sm text-gray-400">
              暂无专业，点击「加专业」添加
            </div>
            <div v-else class="divide-y divide-gray-100">
              <div v-for="major in college.majors" :key="major.id" class="px-5">
                <!-- 专业行 -->
                <div class="flex items-center justify-between py-3">
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      class="p-1 rounded text-gray-400 hover:text-primary-600"
                      @click="toggleMajor(major.id)"
                    >
                      <svg
                        class="w-3.5 h-3.5 transition-transform"
                        :class="expandedMajors.has(major.id) ? 'rotate-90' : ''"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <span class="text-sm font-medium text-gray-700">{{ major.name }}</span>
                    <span class="text-xs text-gray-400">({{ major.code }})</span>
                    <span class="text-xs text-gray-400">· {{ major._count?.classes || 0 }} 班</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="px-2 py-0.5 text-xs text-primary-600 hover:text-primary-700"
                      @click="openClassCreate(major)"
                    >
                      加班级
                    </button>
                    <button
                      type="button"
                      class="px-2 py-0.5 text-xs text-red-600 hover:text-red-700"
                      @click="deleteMajor(major)"
                    >
                      删除
                    </button>
                  </div>
                </div>

                <!-- 班级列表（展开） -->
                <div v-if="expandedMajors.has(major.id)" class="pb-3 pl-12">
                  <div v-if="!major.classes?.length" class="py-2 text-xs text-gray-400">
                    暂无班级
                  </div>
                  <div v-else class="flex flex-wrap gap-2">
                    <span
                      v-for="cls in major.classes"
                      :key="cls.id"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-700"
                    >
                      {{ cls.grade }} 级 · {{ cls.name }}
                      <button
                        type="button"
                        class="text-gray-300 hover:text-red-500"
                        @click="deleteClass(cls)"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 学院新增/编辑弹窗 -->
    <Modal :show="collegeModal.show" :title="collegeModal.isEdit ? '编辑学院' : '新增学院'" @close="closeCollegeModal">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">学院名称 *</label>
          <input
            v-model="collegeModal.form.name"
            type="text"
            placeholder="例如：计算机学院"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">学院代码 *</label>
          <input
            v-model="collegeModal.form.code"
            type="text"
            placeholder="例如：CS"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">排序（数字越小越靠前）</label>
          <input
            v-model.number="collegeModal.form.sort"
            type="number"
            min="0"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <template #footer>
        <button type="button" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200" @click="closeCollegeModal">取消</button>
        <button type="button" class="px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600" @click="submitCollege">
          {{ collegeModal.isEdit ? '保存' : '创建' }}
        </button>
      </template>
    </Modal>

    <!-- 专业新增弹窗 -->
    <Modal :show="majorModal.show" title="新增专业" @close="closeMajorModal">
      <div class="space-y-4">
        <div class="text-sm text-gray-600">
          所属学院：<span class="font-medium text-gray-900">{{ majorModal.collegeName }}</span>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">专业名称 *</label>
          <input
            v-model="majorModal.form.name"
            type="text"
            placeholder="例如：软件工程"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">专业代码 *</label>
          <input
            v-model="majorModal.form.code"
            type="text"
            placeholder="例如：SE"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">排序</label>
          <input
            v-model.number="majorModal.form.sort"
            type="number"
            min="0"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <template #footer>
        <button type="button" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200" @click="closeMajorModal">取消</button>
        <button type="button" class="px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600" @click="submitMajor">创建</button>
      </template>
    </Modal>

    <!-- 班级新增弹窗 -->
    <Modal :show="classModal.show" title="新增班级" @close="closeClassModal">
      <div class="space-y-4">
        <div class="text-sm text-gray-600">
          所属专业：<span class="font-medium text-gray-900">{{ classModal.majorName }}</span>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">班级名称 *</label>
          <input
            v-model="classModal.form.name"
            type="text"
            placeholder="例如：1班"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">年级 *</label>
          <input
            v-model.number="classModal.form.grade"
            type="number"
            min="2000"
            :max="2100"
            placeholder="例如：2025"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <template #footer>
        <button type="button" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200" @click="closeClassModal">取消</button>
        <button type="button" class="px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600" @click="submitClass">创建</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { get, post, put, del } from '@/utils/request'
import Modal from '@/admin/components/Modal.vue'
import type { College, Major, Class } from '@/types'

interface AdminMajor extends Major {
  classes?: Class[]
  _count?: { classes: number }
}

interface AdminCollege extends College {
  majors?: AdminMajor[]
  _count?: { majors: number }
}

const list = ref<AdminCollege[]>([])
const loading = ref(true)
const error = ref('')

// 展开状态
const expandedColleges = reactive(new Set<string>())
const expandedMajors = reactive(new Set<string>())

async function fetchList() {
  loading.value = true
  error.value = ''
  try {
    list.value = await get<AdminCollege[]>('/admin/colleges')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载学院列表失败'
    list.value = []
  } finally {
    loading.value = false
  }
}

function toggleCollege(id: string) {
  if (expandedColleges.has(id)) expandedColleges.delete(id)
  else expandedColleges.add(id)
}

function toggleMajor(id: string) {
  if (expandedMajors.has(id)) expandedMajors.delete(id)
  else expandedMajors.add(id)
}

// ==================== 学院 CRUD ====================
const collegeModal = ref<{
  show: boolean
  isEdit: boolean
  id?: string
  form: { name: string; code: string; sort: number }
}>({
  show: false,
  isEdit: false,
  form: { name: '', code: '', sort: 0 },
})

function openCollegeCreate() {
  collegeModal.value = {
    show: true,
    isEdit: false,
    form: { name: '', code: '', sort: 0 },
  }
}

function openCollegeEdit(college: AdminCollege) {
  collegeModal.value = {
    show: true,
    isEdit: true,
    id: college.id,
    form: { name: college.name, code: college.code, sort: college.sort || 0 },
  }
}

function closeCollegeModal() {
  collegeModal.value.show = false
}

async function submitCollege() {
  const f = collegeModal.value.form
  if (!f.name || !f.code) {
    error.value = '名称和代码为必填'
    return
  }
  try {
    if (collegeModal.value.isEdit && collegeModal.value.id) {
      await put(`/admin/colleges/${collegeModal.value.id}`, { name: f.name, code: f.code, sort: f.sort })
    } else {
      await post('/admin/colleges', { name: f.name, code: f.code, sort: f.sort })
    }
    await fetchList()
    closeCollegeModal()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  }
}

async function deleteCollege(college: AdminCollege) {
  if (!confirm(`确认删除学院「${college.name}」吗？其下所有专业和班级将一并删除。`)) return
  try {
    await del(`/admin/colleges/${college.id}`)
    await fetchList()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  }
}

// ==================== 专业 CRUD ====================
const majorModal = ref<{
  show: boolean
  collegeId: string
  collegeName: string
  form: { name: string; code: string; sort: number }
}>({
  show: false,
  collegeId: '',
  collegeName: '',
  form: { name: '', code: '', sort: 0 },
})

function openMajorCreate(college: AdminCollege) {
  // 自动展开该学院
  expandedColleges.add(college.id)
  majorModal.value = {
    show: true,
    collegeId: college.id,
    collegeName: college.name,
    form: { name: '', code: '', sort: 0 },
  }
}

function closeMajorModal() {
  majorModal.value.show = false
}

async function submitMajor() {
  const f = majorModal.value.form
  if (!f.name || !f.code) {
    error.value = '名称和代码为必填'
    return
  }
  try {
    await post('/admin/majors', {
      name: f.name,
      code: f.code,
      collegeId: majorModal.value.collegeId,
      sort: f.sort,
    })
    await fetchList()
    closeMajorModal()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '创建专业失败'
  }
}

async function deleteMajor(major: AdminMajor) {
  if (!confirm(`确认删除专业「${major.name}」吗？其下所有班级将一并删除。`)) return
  try {
    await del(`/admin/majors/${major.id}`)
    await fetchList()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  }
}

// ==================== 班级 CRUD ====================
const classModal = ref<{
  show: boolean
  majorId: string
  majorName: string
  form: { name: string; grade: number | null }
}>({
  show: false,
  majorId: '',
  majorName: '',
  form: { name: '', grade: null },
})

function openClassCreate(major: AdminMajor) {
  // 自动展开该专业
  expandedMajors.add(major.id)
  classModal.value = {
    show: true,
    majorId: major.id,
    majorName: major.name,
    form: { name: '', grade: new Date().getFullYear() },
  }
}

function closeClassModal() {
  classModal.value.show = false
}

async function submitClass() {
  const f = classModal.value.form
  if (!f.name || !f.grade) {
    error.value = '名称和年级为必填'
    return
  }
  try {
    await post('/admin/classes', {
      name: f.name,
      grade: f.grade,
      majorId: classModal.value.majorId,
    })
    await fetchList()
    closeClassModal()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '创建班级失败'
  }
}

async function deleteClass(cls: Class) {
  if (!confirm(`确认删除班级「${cls.grade}级 ${cls.name}」吗？`)) return
  try {
    await del(`/admin/classes/${cls.id}`)
    await fetchList()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  }
}

onMounted(fetchList)
</script>
