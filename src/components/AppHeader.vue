<template>
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
    <div class="container-page">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2 shrink-0">
          <span class="text-xl font-bold text-gradient">教材ING</span>
        </RouterLink>

        <!-- 桌面端导航 -->
        <nav class="hidden md:flex items-center gap-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="item.path"
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 transition-colors hover:text-primary-600 hover:bg-primary-50"
            active-class="!text-primary-600 !bg-primary-50"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <!-- 右侧操作区 -->
        <div class="flex items-center gap-3">
          <!-- 未登录：显示登录按钮 -->
          <template v-if="!auth.isAuthenticated">
            <RouterLink to="/login" class="btn-primary !px-5 !py-2 text-sm hidden sm:inline-flex">
              登录
            </RouterLink>
          </template>

          <!-- 已登录：显示头像 + 积分 + 退出 -->
          <template v-else>
            <div class="hidden sm:flex items-center gap-3">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 1l2.5 5.5L18 7l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L10 1z" />
                </svg>
                {{ auth.userPoints }} 积分
              </span>
              <RouterLink to="/profile" class="flex items-center gap-2 group">
                <img
                  v-if="auth.user?.avatar"
                  :src="auth.user.avatar"
                  :alt="auth.user.name"
                  class="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <span
                  v-else
                  class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white flex items-center justify-center text-sm font-medium"
                >
                  {{ avatarText }}
                </span>
                <span class="text-sm font-medium text-slate-700 group-hover:text-primary-600">
                  {{ auth.user?.name }}
                </span>
              </RouterLink>
              <RouterLink
                v-if="auth.userRole === 'ADMIN'"
                to="/admin"
                class="text-sm text-slate-500 hover:text-primary-600 transition-colors"
              >
                管理后台
              </RouterLink>
              <button
                type="button"
                class="text-sm text-slate-500 hover:text-red-500 transition-colors"
                @click="handleLogout"
              >
                退出
              </button>
            </div>
          </template>

          <!-- 移动端汉堡菜单按钮 -->
          <button
            type="button"
            class="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="菜单"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 移动端下拉菜单 -->
      <Transition name="slide-down">
        <nav v-if="mobileMenuOpen" class="md:hidden py-3 border-t border-slate-100 space-y-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="item.path"
            class="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50"
            active-class="!text-primary-600 !bg-primary-50"
            @click="mobileMenuOpen = false"
          >
            {{ item.label }}
          </RouterLink>

          <!-- 移动端登录/用户区 -->
          <div class="pt-2 mt-2 border-t border-slate-100">
            <template v-if="!auth.isAuthenticated">
              <RouterLink
                to="/login"
                class="block px-4 py-2.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50"
                @click="mobileMenuOpen = false"
              >
                登录 / 注册
              </RouterLink>
            </template>
            <template v-else>
              <div class="px-4 py-2 text-sm text-slate-500">
                {{ auth.user?.name }} · {{ auth.userPoints }} 积分
              </div>
              <RouterLink
                to="/profile"
                class="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50"
                @click="mobileMenuOpen = false"
              >
                个人中心
              </RouterLink>
              <RouterLink
                v-if="auth.userRole === 'ADMIN'"
                to="/admin"
                class="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50"
                @click="mobileMenuOpen = false"
              >
                管理后台
              </RouterLink>
              <button
                type="button"
                class="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50"
                @click="handleLogout"
              >
                退出登录
              </button>
            </template>
          </div>
        </nav>
      </Transition>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const mobileMenuOpen = ref(false)

interface NavItem {
  name: string
  label: string
  path: string
}

const navItems: NavItem[] = [
  { name: 'home', label: '首页', path: '/' },
  { name: 'search', label: '教材查询', path: '/search' },
  { name: 'calendar', label: '校历查询', path: '/calendar' },
  { name: 'news', label: '新闻中心', path: '/news' },
]

// 头像占位文字（取姓名首字）
const avatarText = computed(() => {
  const name = auth.user?.name
  return name ? name.charAt(0).toUpperCase() : 'U'
})

async function handleLogout() {
  mobileMenuOpen.value = false
  await auth.logout()
  router.push('/')
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
