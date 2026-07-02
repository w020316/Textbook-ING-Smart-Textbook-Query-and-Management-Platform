<script setup lang="ts">
// 面包屑导航组件
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface Crumb {
  title: string
  to?: string
}

// 路由名称到中文标题的映射
const titleMap: Record<string, string> = {
  home: '首页',
  search: '教材查询',
  'textbook-detail': '教材详情',
  calendar: '校历查询',
  news: '新闻中心',
  'news-detail': '新闻详情',
  about: '关于我们',
  profile: '个人中心',
  login: '登录',
  register: '注册',
  'forgot-password': '找回密码',
}

const route = useRoute()
const router = useRouter()

const crumbs = computed<Crumb[]>(() => {
  const matched = route.matched.filter(r => r.name && r.meta?.title)
  const result: Crumb[] = [{ title: '首页', to: '/' }]
  
  for (const r of matched) {
    if (r.name === 'home') continue
    const title = (r.meta?.title as string) || titleMap[r.name as string] || ''
    if (title) {
      result.push({
        title,
        to: r.path.includes(':') ? undefined : r.path,
      })
    }
  }
  return result
})

function go(to?: string) {
  if (to && to !== route.path) router.push(to)
}
</script>

<template>
  <nav v-if="crumbs.length > 1" class="flex items-center text-sm text-gray-500 py-3">
    <template v-for="(crumb, i) in crumbs" :key="i">
      <span v-if="i > 0" class="mx-2 text-gray-300">/</span>
      <a
        v-if="crumb.to && i < crumbs.length - 1"
        @click="go(crumb.to)"
        class="hover:text-primary-600 cursor-pointer transition-colors"
      >{{ crumb.title }}</a>
      <span v-else class="text-gray-700 font-medium">{{ crumb.title }}</span>
    </template>
  </nav>
</template>
