<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900">校历查询</h1>
      <p class="mt-1 text-sm text-slate-500">查询各学期教学周安排和重要时间节点</p>
    </div>

    <!-- 筛选区域 -->
    <div class="card p-5">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- 学期（必选） -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            学期<span class="text-red-500 ml-0.5">*</span>
          </label>
          <select v-model="semesterId" class="input-field">
            <option value="">请选择学期</option>
            <option v-for="s in semesters" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <!-- 专业（可选） -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            专业<span class="text-slate-300 ml-0.5">*</span>
          </label>
          <select v-model="majorId" class="input-field">
            <option value="">全部专业</option>
            <option v-for="m in majors" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </div>
        <!-- 年级（可选） -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            年级<span class="text-slate-300 ml-0.5">*</span>
          </label>
          <select v-model="grade" class="input-field">
            <option value="">全部年级</option>
            <option v-for="g in gradeOptions" :key="g" :value="g">{{ g }} 级</option>
          </select>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <button
          type="button"
          class="btn-primary"
          :disabled="!semesterId || loading"
          @click="handleQuery"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          查询校历
        </button>
      </div>
    </div>

    <!-- 查询结果 -->
    <!-- 加载中 -->
    <div v-if="loading" class="text-center py-20 text-slate-400">
      <svg class="animate-spin w-8 h-8 mx-auto text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
      </svg>
      <p class="mt-3 text-sm">加载中...</p>
    </div>

    <template v-else>
      <!-- 未查询 -->
      <div v-if="!hasQueried" class="card py-20 text-center text-slate-400">
        <svg class="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="mt-3 text-sm">请选择学期并点击“查询校历”查看结果</p>
      </div>

      <!-- 已查询：空数据 -->
      <div v-else-if="!weeks.length" class="card py-20 text-center text-slate-400">
        <svg class="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-3 text-sm">该学期暂无校历数据</p>
      </div>

      <!-- 已查询：教学周时间轴 -->
      <div v-else>
        <!-- 学期概览 -->
        <div class="card p-5 mb-5 bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-100">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">{{ currentSemesterName }}</h2>
              <p class="mt-1 text-sm text-slate-500">
                {{ weeks.length }} 个教学周
              </p>
            </div>
            <!-- 图例 -->
            <div class="flex items-center gap-3 flex-wrap text-xs">
              <span class="inline-flex items-center gap-1.5 text-slate-600">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>开学
              </span>
              <span class="inline-flex items-center gap-1.5 text-slate-600">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>考试
              </span>
              <span class="inline-flex items-center gap-1.5 text-slate-600">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>假期
              </span>
              <span class="inline-flex items-center gap-1.5 text-slate-600">
                <span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span>常规
              </span>
            </div>
          </div>
        </div>

        <!-- 时间轴 -->
        <div class="relative pl-8 sm:pl-10">
          <!-- 竖线 -->
          <div class="absolute left-3 sm:left-4 top-3 bottom-3 w-px bg-slate-200"></div>

          <div class="space-y-4">
            <div v-for="w in weeks" :key="w.id" class="relative">
              <!-- 节点 -->
              <span
                class="absolute -left-8 sm:-left-10 top-4 w-5 h-5 rounded-full border-2 border-white shadow ring-1 ring-slate-200"
                :class="eventDotClass(w.eventType)"
              ></span>

              <!-- 周次卡片 -->
              <div class="card p-4 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between gap-3 flex-wrap">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="text-base font-semibold text-slate-900">第 {{ w.weekNumber }} 周</h3>
                      <span
                        v-if="w.eventType !== 'NORMAL' && w.event"
                        class="tag"
                        :class="eventTagClass(w.eventType)"
                      >
                        {{ w.event }}
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-slate-500">
                      {{ formatDate(w.startDate) }} ~ {{ formatDate(w.endDate) }}
                    </p>
                    <p v-if="w.eventType === 'NORMAL' && w.event" class="mt-2 text-sm text-slate-600">
                      {{ w.event }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { get } from '@/utils/request'
import type { Semester, Major, College, CalendarWeek, EventType } from '@/types'

// ==================== 筛选条件 ====================
const semesterId = ref('')
const majorId = ref('')
const grade = ref('')

// ==================== 下拉数据 ====================
const semesters = ref<Semester[]>([])
const majors = ref<Major[]>([])

// ==================== 结果数据 ====================
const weeks = ref<CalendarWeek[]>([])
const loading = ref(false)
const hasQueried = ref(false)

// 年级选项：当前年份往前推 5 年
const gradeOptions = computed(() => {
  const now = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => now - i)
})

// 当前选中的学期名称
const currentSemesterName = computed(() => {
  const s = semesters.value.find((item) => item.id === semesterId.value)
  return s?.name ?? '校历安排'
})

// ==================== 数据加载 ====================
async function loadSemesters() {
  try {
    semesters.value = await get<Semester[]>('/semesters')
  } catch {
    semesters.value = []
  }
}

// 加载全部专业：遍历学院获取并合并（接口仅提供按学院查询）
async function loadMajors() {
  try {
    const colleges = await get<College[]>('/colleges')
    const lists = await Promise.all(
      colleges.map((c) => get<Major[]>(`/colleges/${c.id}/majors`).catch(() => [] as Major[])),
    )
    majors.value = lists.flat()
  } catch {
    majors.value = []
  }
}

async function loadCalendar() {
  if (!semesterId.value) return
  loading.value = true
  try {
    const params: Record<string, unknown> = { semesterId: semesterId.value }
    if (majorId.value) params.majorId = majorId.value
    if (grade.value) params.grade = grade.value
    weeks.value = await get<CalendarWeek[]>('/calendar', params)
  } catch {
    weeks.value = []
  } finally {
    loading.value = false
  }
}

// ==================== 交互处理 ====================
function handleQuery() {
  if (!semesterId.value) return
  hasQueried.value = true
  loadCalendar()
}

// ==================== 样式映射 ====================
function eventDotClass(type: EventType): string {
  const map: Record<EventType, string> = {
    START: 'bg-emerald-500',
    EXAM: 'bg-red-500',
    HOLIDAY: 'bg-blue-500',
    NORMAL: 'bg-slate-300',
  }
  return map[type] || 'bg-slate-300'
}

function eventTagClass(type: EventType): string {
  const map: Record<EventType, string> = {
    START: 'bg-emerald-50 text-emerald-700',
    EXAM: 'bg-red-50 text-red-700',
    HOLIDAY: 'bg-blue-50 text-blue-700',
    NORMAL: 'bg-slate-100 text-slate-600',
  }
  return map[type] || 'bg-slate-100 text-slate-600'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ==================== 初始化 ====================
onMounted(async () => {
  await Promise.all([loadSemesters(), loadMajors()])
})
</script>
