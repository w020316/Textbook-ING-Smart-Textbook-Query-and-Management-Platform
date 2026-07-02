<template>
  <div>
    <!-- ============ Hero 区域 ============ -->
    <section
      class="full-bleed -mt-6 relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 text-white"
    >
      <!-- 装饰光斑 -->
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 -left-24 w-96 h-96 bg-secondary-500/30 rounded-full blur-3xl pointer-events-none"></div>

      <div class="container-page relative z-10 py-24 md:py-32 text-center">
        <span class="inline-block px-4 py-1.5 mb-6 rounded-full bg-white/15 backdrop-blur text-sm font-medium tracking-wide">
          校园信息服务平台
        </span>
        <h1 class="text-5xl md:text-7xl font-bold mb-5 tracking-tight">教材ING</h1>
        <p class="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
          校园信息服务平台，让信息查询变得简单高效
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button class="btn-gradient !px-8 !py-3.5 text-base" @click="router.push('/search')">
            查询教材
          </button>
          <button
            class="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-600 font-medium rounded-lg transition-all hover:bg-primary-50 active:scale-95 text-base shadow-lg shadow-black/10"
            @click="router.push('/calendar')"
          >
            查询校历
          </button>
        </div>
      </div>

      <!-- 底部波浪过渡 -->
      <div class="absolute bottom-0 left-0 w-full leading-none pointer-events-none">
        <svg class="w-full h-[60px] md:h-[100px]" viewBox="0 0 1440 100" preserveAspectRatio="none" fill="none">
          <path
            d="M0,40 C240,90 480,10 720,40 C960,70 1200,20 1440,50 L1440,100 L0,100 Z"
            fill="#f8fafc"
          />
        </svg>
      </div>
    </section>

    <!-- ============ 特性展示 为什么选择我们 ============ -->
    <section class="py-16 md:py-24">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold mb-3">为什么选择我们</h2>
        <p class="text-slate-500 text-lg">为师生提供便捷的教材查询服务</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="f in features"
          :key="f.title"
          class="card p-6 text-center hover:-translate-y-1.5 transition-all duration-300"
        >
          <div
            class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center"
            v-html="f.icon"
          ></div>
          <h3 class="text-lg font-semibold mb-2">{{ f.title }}</h3>
          <p class="text-sm text-slate-500 leading-relaxed">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ============ 功能入口 ============ -->
    <section class="py-16 md:py-24">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 教材查询 -->
        <div class="card p-8 md:p-10 flex flex-col hover:-translate-y-1.5 transition-all duration-300">
          <div class="w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 class="text-2xl font-bold mb-3">教材查询</h3>
          <p class="text-slate-500 leading-relaxed mb-6 flex-1">
            多维度查询教材信息，支持按学院、专业、班级等条件精准筛选，快速定位所需教材
          </p>
          <button class="btn-primary self-start" @click="router.push('/search')">立即查询</button>
        </div>

        <!-- 校历查询 -->
        <div class="card p-8 md:p-10 flex flex-col hover:-translate-y-1.5 transition-all duration-300">
          <div class="w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-600 text-white flex items-center justify-center">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 class="text-2xl font-bold mb-3">校历查询</h3>
          <p class="text-slate-500 leading-relaxed mb-6 flex-1">
            查看学期教学日历安排，掌握开学、放假、考试等重要时间节点，合理规划学习时间
          </p>
          <button class="btn-primary self-start" @click="router.push('/calendar')">查看校历</button>
        </div>
      </div>
    </section>

    <!-- ============ 新闻资讯 ============ -->
    <section class="py-16 md:py-24">
      <div class="flex items-end justify-between mb-10 gap-4">
        <div>
          <h2 class="text-3xl md:text-4xl font-bold mb-2">新闻资讯</h2>
          <p class="text-slate-500 text-lg">校园最新动态</p>
        </div>
        <RouterLink
          to="/news"
          class="shrink-0 text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
        >
          查看更多
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </RouterLink>
      </div>

      <div v-if="newsList.length" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NewsCard v-for="n in newsList" :key="n.id" :news="n" />
      </div>
      <div v-else class="card p-12 text-center text-slate-400">
        暂无新闻资讯，
        <RouterLink to="/news" class="text-primary-600 hover:underline">前往新闻中心</RouterLink>
      </div>
    </section>

    <!-- ============ 数据统计 ============ -->
    <section class="full-bleed bg-slate-900 text-white">
      <div class="container-page py-16 md:py-20">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div v-for="s in statsItems" :key="s.label">
            <div class="text-4xl md:text-5xl font-bold text-gradient mb-2">{{ s.value }}+</div>
            <div class="text-slate-400 text-sm md:text-base">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 用户反馈 ============ -->
    <section class="py-16 md:py-24">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold mb-3">用户反馈</h2>
        <p class="text-slate-500 text-lg">来自使用者的真实评价</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="t in testimonials"
          :key="t.name"
          class="card p-6 hover:-translate-y-1 transition-all duration-300"
        >
          <div class="flex items-center gap-1 text-amber-400 mb-4">
            <svg
              v-for="i in 5"
              :key="i"
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M10 1l2.5 5.5L18 7l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L10 1z"
              />
            </svg>
          </div>
          <p class="text-slate-600 leading-relaxed mb-5">“{{ t.content }}”</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white flex items-center justify-center font-medium">
              {{ t.name.charAt(0) }}
            </div>
            <div>
              <div class="font-medium text-slate-800">{{ t.name }}</div>
              <div class="text-sm text-slate-400">{{ t.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 底部 CTA 开始使用 ============ -->
    <section
      class="full-bleed bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 text-white"
    >
      <div class="container-page py-16 md:py-20 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-3">开始使用</h2>
        <p class="text-white/90 text-lg mb-8">立即查询您需要的教材信息</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            class="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-600 font-medium rounded-lg transition-all hover:bg-primary-50 active:scale-95 text-base shadow-lg shadow-black/10"
            @click="router.push('/search')"
          >
            立即查询
          </button>
          <button
            v-if="!auth.isAuthenticated"
            class="inline-flex items-center justify-center px-8 py-3.5 bg-white/15 backdrop-blur text-white font-medium rounded-lg transition-all hover:bg-white/25 active:scale-95 text-base border border-white/30"
            @click="router.push('/login')"
          >
            登录账号
          </button>
        </div>
        <div class="mt-10 flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center text-sm text-white/85">
          <span class="inline-flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 2a6 6 0 00-6 6c0 1.5.6 2.9 1.6 3.9L5 14l2.5-1c.8.3 1.6.5 2.5.5a6 6 0 000-12zM7 8.5a.9.9 0 11-1.8 0 .9.9 0 011.8 0zm3 0a.9.9 0 11-1.8 0 .9.9 0 011.8 0zm3 0a.9.9 0 11-1.8 0 .9.9 0 011.8 0z"
                clip-rule="evenodd"
              />
            </svg>
            微信公众号：教材ING
          </span>
          <span class="inline-flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.5 9h-2.1l-2.4 2.4a.7.7 0 01-1-1L9 11.6V8.5a.7.7 0 011.4 0v2.1h3.1a.7.7 0 010 1.4z"
              />
            </svg>
            QQ交流群：123456789
          </span>
        </div>
        <!-- 管理后台入口 -->
        <div class="mt-8 pt-8 border-t border-white/20 text-center">
          <RouterLink
            to="/admin/login"
            class="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            管理员入口
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { get } from '@/utils/request'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import NewsCard from '@/components/NewsCard.vue'
import type { News } from '@/types'

const router = useRouter()
const appStore = useAppStore()
const auth = useAuthStore()

const newsList = ref<News[]>([])

interface NewsListResponse {
  pinned: News[]
  list: News[]
  total: number
}

const features = [
  {
    title: '快速查询',
    desc: '秒级响应，即时获取教材信息',
    icon: `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
  },
  {
    title: '数据准确',
    desc: '官方数据源，信息实时更新',
    icon: `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
  },
  {
    title: '多维度筛选',
    desc: '学院/专业/班级精准定位',
    icon: `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 3v-4.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>`,
  },
  {
    title: '校历同步',
    desc: '教学周安排一目了然',
    icon: `<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
  },
]

const testimonials = [
  { name: '张同学', role: '大二学生', content: '查询速度很快，教材信息很全，省了不少时间！' },
  { name: '李老师', role: '教务处', content: '校历查询功能很实用，方便学生了解教学安排。' },
  { name: '王同学', role: '大三学生', content: '界面简洁，操作方便，找教材再也不头疼了。' },
]

const statsItems = computed(() => [
  { label: '覆盖学期', value: appStore.stats.semesterCount || 6 },
  { label: '教材数量', value: appStore.stats.textbookCount || 5000 },
  { label: '服务用户', value: appStore.stats.userCount || 1000 },
  { label: '院系覆盖', value: appStore.stats.collegeCount || 8 },
])

onMounted(() => {
  appStore.fetchStats()
  fetchNews()
})

async function fetchNews() {
  try {
    const data = await get<NewsListResponse>('/news', { pageSize: 3 })
    newsList.value = [...(data.pinned || []), ...(data.list || [])].slice(0, 3)
  } catch {
    newsList.value = []
  }
}
</script>

<style scoped>
/* 全屏出血：逃出父级 container-page 限制，撑满视口宽度 */
.full-bleed {
  width: 100vw;
  position: relative;
  left: 50%;
  margin-left: -50vw;
}
</style>
