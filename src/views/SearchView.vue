<template>
  <!-- ==================== 未登录状态 ==================== -->
  <div v-if="!auth.isAuthenticated" class="flex items-center justify-center py-16 sm:py-24">
    <div class="card max-w-md w-full p-8 sm:p-10 text-center">
      <!-- 图标 -->
      <div class="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm-1-9C7.03 2 4 5.03 4 9c0 3.02 1.8 4.7 3.2 6.3.7.8 1.3 1.6 1.5 2.7h2.6c.2-1.1.8-1.9 1.5-2.7C16.2 13.7 18 12.02 18 9c0-3.97-3.03-7-7-7z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19h6M10 22h4" />
        </svg>
      </div>

      <h2 class="mt-6 text-xl font-semibold text-slate-900">请先登录</h2>
      <p class="mt-2 text-sm text-slate-500 leading-relaxed">
        登录后即可查询教材信息，新用户注册赠送<span class="text-amber-600 font-medium">100 积分</span>
      </p>

      <button type="button" class="btn-primary mt-6 w-full" @click="router.push('/login')">
        立即登录
      </button>
    </div>
  </div>

  <!-- ==================== 已登录状态 ==================== -->
  <div v-else class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">教材查询</h1>
        <p class="mt-1 text-sm text-slate-500">搜索所需教材，支持按学院、专业、班级和学期筛选</p>
      </div>
      <span class="hidden sm:inline-block text-sm text-slate-400">共 {{ total }} 本教材</span>
    </div>

    <!-- 搜索区 -->
    <div class="card p-5 space-y-4">
      <!-- 关键词 + 搜索按钮 -->
      <div class="flex gap-3">
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="keyword"
            type="text"
            class="input-field !pl-10"
            placeholder="输入教材名称、作者或 ISBN..."
            @keyup.enter="handleSearch"
          />
        </div>
        <button type="button" class="btn-primary shrink-0" @click="handleSearch">
          <svg class="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="hidden sm:inline">搜索</span>
        </button>
      </div>

      <!-- 筛选下拉框 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select v-model="collegeId" class="input-field" @change="handleCollegeChange">
          <option value="">全部学院</option>
          <option v-for="c in colleges" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-model="majorId" class="input-field" :disabled="!collegeId" @change="handleMajorChange">
          <option value="">{{ collegeId ? '全部专业' : '请先选择学院' }}</option>
          <option v-for="m in majors" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
        <select v-model="classId" class="input-field" :disabled="!majorId" @change="handleClassChange">
          <option value="">{{ majorId ? '全部班级' : '请先选择专业' }}</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-model="semesterId" class="input-field" @change="handleSemesterChange">
          <option value="">全部学期</option>
          <option v-for="s in semesters" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
    </div>

    <!-- 热门搜索 -->
    <div v-if="hotSearches.length" class="flex items-center gap-2 flex-wrap">
      <span class="text-sm text-slate-500 inline-flex items-center gap-1">
        <svg class="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M12.39 5.61c-.42-.42-.83-.84-1.06-1.39-.23-.55-.21-1.3.05-2.05C9.43 2.69 8 4.5 8 6.5c0 .83.27 1.55.72 2.18C7.94 8.13 7 7.13 7 5.5c-.61.55-1 1.35-1 2.25C6 10.43 8.57 13 11.75 13c2.9 0 5.25-2.35 5.25-5.25 0-1.4-.55-2.67-1.44-3.61-.21 1.05-.85 1.86-1.71 2.4.18-.97-.04-1.93-.46-2.93z" />
        </svg>
        热门搜索
      </span>
      <button
        v-for="h in hotSearches"
        :key="h.id"
        type="button"
        class="tag-primary hover:bg-primary-100 cursor-pointer transition-colors"
        @click="searchByHot(h.keyword)"
      >
        {{ h.keyword }}
      </button>
    </div>

    <!-- 搜索结果 -->
    <div v-if="loading" class="text-center py-20 text-slate-400">
      <svg class="animate-spin w-8 h-8 mx-auto text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
      </svg>
      <p class="mt-3 text-sm">加载中...</p>
    </div>

    <div v-else-if="!textbooks.length" class="card py-20 text-center text-slate-400">
      <svg class="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <p class="mt-3 text-sm">暂无教材数据</p>
    </div>

    <div v-else class="space-y-4">
      <article
        v-for="t in textbooks"
        :key="t.id"
        class="card p-5 hover:-translate-y-0.5 transition-all duration-300"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-slate-900 truncate">{{ t.title }}</h3>
            <p class="mt-1 text-sm text-slate-500">
              {{ t.author }}<span class="mx-1.5 text-slate-300">·</span>{{ t.publisher }}
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span class="tag bg-slate-100 text-slate-600">
                <span class="text-slate-400 mr-1">ISBN</span>{{ t.isbn }}
              </span>
              <span v-if="t.course" class="tag-success">{{ t.course.name }}</span>
            </div>
          </div>
          <div class="shrink-0 text-right">
            <div class="text-xl font-bold text-primary-600">¥{{ formatPrice(t.price) }}</div>
          </div>
        </div>
      </article>

      <Pagination
        :current="page"
        :total="total"
        :page-size="pageSize"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '@/utils/request'
import { useAuthStore } from '@/stores/auth'
import Pagination from '@/components/Pagination.vue'
import type { Textbook, College, Major, Class, Semester, HotSearch, PaginatedResponse } from '@/types'

const auth = useAuthStore()
const router = useRouter()

// ==================== 筛选条件 ====================
const keyword = ref('')
const collegeId = ref('')
const majorId = ref('')
const classId = ref('')
const semesterId = ref('')

// ==================== 下拉数据 ====================
const colleges = ref<College[]>([])
const majors = ref<Major[]>([])
const classes = ref<Class[]>([])
const semesters = ref<Semester[]>([])
const hotSearches = ref<HotSearch[]>([])

// ==================== 结果数据 ====================
const textbooks = ref<Textbook[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(true)

// ==================== 数据加载 ====================
async function loadColleges() {
  try {
    colleges.value = await get<College[]>('/colleges')
  } catch {
    colleges.value = []
  }
}

async function loadSemesters() {
  try {
    semesters.value = await get<Semester[]>('/semesters')
  } catch {
    semesters.value = []
  }
}

async function loadHotSearches() {
  try {
    hotSearches.value = await get<HotSearch[]>('/textbooks/hot-searches')
  } catch {
    hotSearches.value = []
  }
}

async function loadMajors() {
  if (!collegeId.value) {
    majors.value = []
    return
  }
  try {
    majors.value = await get<Major[]>(`/colleges/${collegeId.value}/majors`)
  } catch {
    majors.value = []
  }
}

async function loadClasses() {
  if (!majorId.value) {
    classes.value = []
    return
  }
  try {
    classes.value = await get<Class[]>(`/majors/${majorId.value}/classes`)
  } catch {
    classes.value = []
  }
}

async function loadTextbooks() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, pageSize: pageSize.value }
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    if (collegeId.value) params.collegeId = collegeId.value
    if (majorId.value) params.majorId = majorId.value
    if (classId.value) params.classId = classId.value
    if (semesterId.value) params.semesterId = semesterId.value
    const res = await get<PaginatedResponse<Textbook>>('/textbooks', params)
    textbooks.value = res.list
    total.value = res.total
  } catch {
    textbooks.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// ==================== 交互处理 ====================
function handleSearch() {
  page.value = 1
  loadTextbooks()
}

function handleCollegeChange() {
  majorId.value = ''
  classId.value = ''
  majors.value = []
  classes.value = []
  loadMajors()
  page.value = 1
  loadTextbooks()
}

function handleMajorChange() {
  classId.value = ''
  classes.value = []
  loadClasses()
  page.value = 1
  loadTextbooks()
}

function handleClassChange() {
  page.value = 1
  loadTextbooks()
}

function handleSemesterChange() {
  page.value = 1
  loadTextbooks()
}

function handlePageChange(p: number) {
  page.value = p
  loadTextbooks()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function searchByHot(k: string) {
  keyword.value = k
  page.value = 1
  loadTextbooks()
}

function formatPrice(price: number): string {
  return Number.isFinite(price) ? price.toFixed(2) : '0.00'
}

// ==================== 初始化 ====================
onMounted(async () => {
  await Promise.all([loadColleges(), loadSemesters(), loadHotSearches()])
  await loadTextbooks()
})
</script>
