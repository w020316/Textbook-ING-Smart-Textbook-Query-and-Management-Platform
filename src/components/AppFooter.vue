<template>
  <footer class="bg-slate-900 text-slate-300">
    <div class="container-page py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- 左侧：Logo + 简介 -->
        <div>
          <h3 class="text-xl font-bold text-white mb-3">
            <span class="text-gradient">教材ING</span>
          </h3>
          <p class="text-sm leading-relaxed text-slate-400 max-w-xs">
            教材ING校园信息服务平台，为师生提供便捷的校园信息查询服务
          </p>
        </div>

        <!-- 中间：快速链接 -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">快速链接</h4>
          <ul class="space-y-2.5">
            <li v-for="link in quickLinks" :key="link.path">
              <RouterLink
                :to="link.path"
                class="text-sm text-slate-400 hover:text-primary-400 transition-colors"
              >
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- 右侧：联系方式 -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">联系我们</h4>
          <ul class="space-y-2.5">
            <li class="flex items-center gap-2 text-sm text-slate-400">
              <svg class="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              微信公众号：教材ING
            </li>
            <li class="flex items-center gap-2 text-sm text-slate-400">
              <svg class="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              QQ交流群：123456789
            </li>
          </ul>
        </div>
      </div>

      <!-- 底部版权 -->
      <div class="mt-10 pt-6 border-t border-slate-800 text-center text-sm text-slate-500">
        <p>© 2026 教材ING. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

interface QuickLink {
  label: string
  path: string
}

const quickLinks: QuickLink[] = [
  { label: '首页', path: '/' },
  { label: '教材查询', path: '/search' },
  { label: '校历查询', path: '/calendar' },
  { label: '新闻中心', path: '/news' },
]
</script>
