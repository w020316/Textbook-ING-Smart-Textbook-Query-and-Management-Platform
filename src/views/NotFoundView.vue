<template>
  <div class="flex flex-col items-center justify-center text-center py-20 md:py-28">
    <!-- 大字 404 -->
    <h1 class="text-[120px] md:text-[180px] leading-none font-bold text-gradient mb-2">404</h1>

    <!-- 描述 -->
    <h2 class="text-2xl md:text-3xl font-bold mb-3">页面未找到</h2>
    <p class="text-slate-500 max-w-md mb-8 leading-relaxed">
      抱歉，您访问的页面不存在或已被移动。请检查地址是否正确，或返回首页继续浏览。
    </p>

    <!-- 操作按钮 -->
    <div class="flex flex-col sm:flex-row gap-3">
      <RouterLink to="/" class="btn-primary !px-8 !py-3">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        返回首页
      </RouterLink>
      <button class="btn-secondary !px-8 !py-3" @click="router.back()">返回上一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'

const router = useRouter()
</script>
