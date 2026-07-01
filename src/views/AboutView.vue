<template>
  <div class="py-8 md:py-12">
    <!-- 页头 -->
    <header class="text-center mb-12 md:mb-16">
      <span class="tag-primary mb-4">关于我们</span>
      <h1 class="text-4xl md:text-5xl font-bold mb-4">关于<span class="text-gradient">教材ING</span></h1>
      <p class="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
        致力于为校园师生打造便捷、高效的信息查询服务平台
      </p>
    </header>

    <!-- 平台简介 -->
    <section class="card p-8 md:p-10 mb-8">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 class="text-2xl font-bold">平台简介</h2>
      </div>
      <div class="space-y-4 text-slate-600 leading-relaxed">
        <p>
          教材ING 是一款面向校园的信息服务平台，聚焦于教材查询与校历管理两大核心场景。
          平台整合了学院、专业、班级、课程、教材及学期校历等多维度数据，为师生提供一站式查询服务。
        </p>
        <p>
          通过简洁直观的界面与多维筛选能力，师生可以快速定位所需教材信息，并随时掌握教学周安排，
          让校园信息获取变得简单高效。
        </p>
      </div>
    </section>

    <!-- 使命愿景 -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="card p-8">
        <div class="w-12 h-12 mb-5 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h3 class="text-xl font-bold mb-3">我们的使命</h3>
        <p class="text-slate-600 leading-relaxed">
          用技术简化校园信息获取流程，让每一位师生都能在数秒内找到所需的教材与教学安排，
          把更多时间留给学习与教学本身。
        </p>
      </div>
      <div class="card p-8">
        <div class="w-12 h-12 mb-5 rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-600 text-white flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </div>
        <h3 class="text-xl font-bold mb-3">我们的愿景</h3>
        <p class="text-slate-600 leading-relaxed">
          成为校园里最值得信赖的信息服务工具，持续拓展服务边界，打造覆盖查询、通知、协作的
          一体化校园信息生态。
        </p>
      </div>
    </section>

    <!-- 技术架构 -->
    <section class="card p-8 md:p-10 mb-12">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold">技术架构</h2>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div
          v-for="t in techStack"
          :key="t.name"
          class="flex items-center gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100"
        >
          <span class="text-2xl">{{ t.icon }}</span>
          <div>
            <div class="font-semibold text-slate-800">{{ t.name }}</div>
            <div class="text-xs text-slate-400">{{ t.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="text-center">
      <h3 class="text-2xl font-bold mb-3">立即体验</h3>
      <p class="text-slate-500 mb-6">开始查询您需要的教材与校历信息</p>
      <RouterLink to="/search" class="btn-gradient !px-8 !py-3.5 text-base">前往查询</RouterLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

const techStack = [
  { name: 'Vue 3', desc: '渐进式前端框架', icon: '⚙️' },
  { name: 'TypeScript', desc: '类型安全', icon: '🛡️' },
  { name: 'TailwindCSS', desc: '原子化样式', icon: '🎨' },
  { name: 'Vite', desc: '极速构建工具', icon: '⚡' },
  { name: 'Prisma', desc: '类型安全 ORM', icon: '🗄️' },
  { name: 'Pinia', desc: '状态管理', icon: '📦' },
]
</script>
