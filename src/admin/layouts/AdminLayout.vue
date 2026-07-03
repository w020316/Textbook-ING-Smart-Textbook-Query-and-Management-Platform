<template>
  <div class="min-h-screen flex bg-gray-50">
    <!-- 移动端遮罩 -->
    <transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 bg-black/50 md:hidden"
        @click="sidebarOpen = false"
      />
    </transition>

    <!-- 侧边栏 -->
    <aside
      class="fixed md:static z-40 inset-y-0 left-0 w-64 bg-gray-800 text-white flex flex-col transition-transform duration-200 md:translate-x-0 shrink-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- 品牌区 -->
      <div class="h-16 flex items-center px-5 border-b border-gray-700 shrink-0">
        <span class="text-lg font-bold tracking-tight">教材ING</span>
        <span class="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-gray-700 text-gray-300">管理后台</span>
      </div>

      <!-- 导航菜单 -->
      <nav class="flex-1 overflow-y-auto py-4">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-5 py-2.5 text-sm border-l-4 transition-colors"
          :class="isActive(item.path)
            ? 'bg-gray-900 text-white border-primary-500'
            : 'text-gray-300 border-transparent hover:bg-gray-700 hover:text-white'"
          @click="sidebarOpen = false"
        >
          <span class="w-5 h-5 shrink-0" v-html="item.icon"></span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- 底部信息 -->
      <div class="px-5 py-4 border-t border-gray-700 text-xs text-gray-400 shrink-0">
        © 教材ING 管理后台
      </div>
    </aside>

    <!-- 主区域 -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- 顶部栏 -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <!-- 移动端菜单按钮 -->
          <button
            type="button"
            class="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="切换菜单"
            @click="sidebarOpen = !sidebarOpen"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 class="text-base md:text-lg font-semibold text-gray-800 truncate">教材ING 管理后台</h1>
        </div>

        <div class="flex items-center gap-1 sm:gap-2 shrink-0">
          <router-link
            to="/"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span class="hidden sm:inline">返回前台</span>
          </router-link>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            @click="handleLogout"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span class="hidden sm:inline">退出</span>
          </button>
        </div>
      </header>

      <!-- 主内容区：使用 keep-alive 缓存后台页面，减少菜单切换时的重复 loading -->
      <main class="flex-1 bg-gray-50 p-4 md:p-6 overflow-auto">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </main>
    </div>

    <!-- 全局 toast 通知容器 -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/adminAuth'
import ToastContainer from '@/admin/components/ToastContainer.vue'

const route = useRoute()
const router = useRouter()
const adminAuthStore = useAdminAuthStore()

// 移动端侧边栏开关
const sidebarOpen = ref(false)

// 导航菜单项
const navItems = [
  {
    label: '仪表盘',
    path: '/admin',
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`,
  },
  {
    label: '教材管理',
    path: '/admin/textbooks',
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  },
  {
    label: '新闻管理',
    path: '/admin/news',
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 0a2 2 0 012 2v8a2 2 0 01-2 2m0-12V6m0 0V4a2 2 0 00-2-2h-2m4 8h-4a2 2 0 00-2 2v0a2 2 0 002 2h4a2 2 0 002-2v0a2 2 0 00-2-2z"/></svg>`,
  },
  {
    label: '用户管理',
    path: '/admin/users',
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-3-3.87"/></svg>`,
  },
  {
    label: '校历管理',
    path: '/admin/calendar',
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
  },
  {
    label: '学院管理',
    path: '/admin/colleges',
    icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-4M9 7h6m-6 4h6m-6 4h4"/></svg>`,
  },
]

// 判断菜单项是否激活（仪表盘仅精确匹配，其余前缀匹配）
function isActive(path: string): boolean {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}

// 退出登录（仅清除管理后台登录态，跳转回管理后台登录页）
async function handleLogout() {
  await adminAuthStore.logout()
  router.push('/admin/login')
}
</script>
