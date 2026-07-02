// Vue Router 路由配置（history 模式）
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
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
        path: 'search/:id',
        name: 'textbook-detail',
        component: () => import('@/views/TextbookDetailView.vue'),
        meta: { title: '教材详情', requiresAuth: true },
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
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/ProfileView.vue'),
        meta: { title: '个人中心', requiresAuth: true },
      },
      {
        path: 'verify-email',
        name: 'verify-email',
        component: () => import('@/views/VerifyEmailView.vue'),
        meta: { title: '邮箱验证' },
      },
      {
        path: 'admin',
        component: () => import('@/admin/layouts/AdminLayout.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
        children: [
          {
            path: '',
            name: 'admin-dashboard',
            component: () => import('@/admin/views/DashboardView.vue'),
            meta: { title: '管理后台', requiresAuth: true, requiresAdmin: true },
          },
          {
            path: 'textbooks',
            name: 'admin-textbooks',
            component: () => import('@/admin/views/TextbookManageView.vue'),
            meta: { title: '教材管理', requiresAuth: true, requiresAdmin: true },
          },
          {
            path: 'news',
            name: 'admin-news',
            component: () => import('@/admin/views/NewsManageView.vue'),
            meta: { title: '新闻管理', requiresAuth: true, requiresAdmin: true },
          },
          {
            path: 'users',
            name: 'admin-users',
            component: () => import('@/admin/views/UserManageView.vue'),
            meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true },
          },
          {
            path: 'calendar',
            name: 'admin-calendar',
            component: () => import('@/admin/views/CalendarManageView.vue'),
            meta: { title: '校历管理', requiresAuth: true, requiresAdmin: true },
          },
          {
            path: 'colleges',
            name: 'admin-colleges',
            component: () => import('@/admin/views/CollegeManageView.vue'),
            meta: { title: '学院管理', requiresAuth: true, requiresAdmin: true },
          },
        ],
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
  history: createWebHistory(),
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
  // 从 localStorage 读取用户角色（登录时已存储）
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const isAdmin = user?.role === 'ADMIN'

  // 需要登录但未登录 → 跳转登录页并记录重定向地址
  if (to.meta.requiresAuth && !isAuthed) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 需要管理员权限但非管理员 → 跳转 403
  if (to.meta.requiresAdmin && !isAdmin) {
    next({ name: 'not-found' })
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
