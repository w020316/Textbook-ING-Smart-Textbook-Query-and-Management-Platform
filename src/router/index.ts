// Vue Router 路由配置（hash 模式）
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'search',
        name: 'search',
        component: () => import('@/views/SearchView.vue'),
        meta: { title: '教材查询', requiresAuth: true },
      },
      {
        path: 'calendar',
        name: 'calendar',
        component: () => import('@/views/CalendarView.vue'),
        meta: { title: '校历查询' },
      },
      {
        path: 'news',
        name: 'news',
        component: () => import('@/views/NewsListView.vue'),
        meta: { title: '新闻中心' },
      },
      {
        path: 'news/:id',
        name: 'news-detail',
        component: () => import('@/views/NewsDetailView.vue'),
        meta: { title: '新闻详情' },
      },
      {
        path: 'about',
        name: 'about',
        component: () => import('@/views/AboutView.vue'),
        meta: { title: '关于我们' },
      },
      {
        path: ':pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/views/NotFoundView.vue'),
        meta: { title: '页面不存在' },
      },
    ],
  },
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
        meta: { title: '登录' },
      },
    ],
  },
  {
    path: '/register',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'register',
        component: () => import('@/views/RegisterView.vue'),
        meta: { title: '注册' },
      },
    ],
  },
  {
    path: '/forgot-password',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'forgot-password',
        component: () => import('@/views/ForgotPasswordView.vue'),
        meta: { title: '找回密码' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// ==================== 全局前置守卫 ====================
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  const title = to.meta.title as string | undefined
  if (title) {
    document.title = `${title} - 教材ING`
  }

  const token = localStorage.getItem('token')
  const isAuthed = !!token

  // 需要登录但未登录 → 跳转登录页并记录重定向地址
  if (to.meta.requiresAuth && !isAuthed) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录访问登录/注册页 → 跳转首页
  if (isAuthed && (to.name === 'login' || to.name === 'register')) {
    next({ path: '/' })
    return
  }

  next()
})

export default router
