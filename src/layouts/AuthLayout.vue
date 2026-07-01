<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 to-secondary-50">
    <!-- 顶部 Logo -->
    <header class="pt-10 pb-6 text-center">
      <RouterLink to="/" class="inline-flex items-center gap-2">
        <span class="text-3xl font-bold text-gradient">教材ING</span>
      </RouterLink>
      <p class="mt-2 text-sm text-slate-500">校园信息服务平台</p>
    </header>

    <!-- 居中卡片内容区 -->
    <main class="flex-1 flex items-center justify-center px-4 pb-10">
      <div class="w-full max-w-md">
        <RouterView v-slot="{ Component }">
          <Transition name="auth" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </main>

    <!-- 底部简短信息 -->
    <footer class="py-6 text-center text-xs text-slate-400">
      <p>© 2026 教材ING. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
</script>

<style scoped>
.auth-enter-active,
.auth-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.auth-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.auth-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
