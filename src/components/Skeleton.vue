<script setup lang="ts">
// 骨架屏组件 - 用于列表加载占位
withDefaults(defineProps<{
  lines?: number
  height?: string
}>(), {
  lines: 3,
  height: 'h-5',
})
</script>

<template>
  <div class="animate-pulse space-y-3">
    <div
      v-for="i in lines"
      :key="i"
      :class="[height, 'bg-gray-200 rounded']"
      :style="{ width: `${70 + Math.random() * 30}%` }"
    />
  </div>
</template>
