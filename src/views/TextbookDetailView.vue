<script setup lang="ts">
// 教材详情页
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get } from '@/utils/request'
import Breadcrumb from '@/components/Breadcrumb.vue'
import Skeleton from '@/components/Skeleton.vue'
import type { Textbook } from '@/types'

const route = useRoute()
const router = useRouter()
const textbook = ref<Textbook | null>(null)
const loading = ref(true)
const error = ref('')

async function loadTextbook() {
  loading.value = true
  error.value = ''
  try {
    const id = route.params.id as string
    textbook.value = await get<Textbook>(`/textbooks/${id}`)
  } catch (e: any) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/search')
}

onMounted(loadTextbook)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <Breadcrumb />

    <Skeleton v-if="loading" :lines="8" height="h-6" />

    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <button @click="goBack" class="text-primary-600 hover:underline">返回教材查询</button>
    </div>

    <div v-else-if="textbook" class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="md:flex">
        <!-- 封面 -->
        <div class="md:w-1/3 bg-gray-100 flex items-center justify-center p-6">
          <div class="w-48 h-64 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white text-center p-4">
            <div>
              <p class="font-bold text-lg">{{ textbook.title }}</p>
              <p class="text-sm mt-2 opacity-80">{{ textbook.author }}</p>
            </div>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="md:w-2/3 p-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-2">{{ textbook.title }}</h1>
          <p class="text-gray-500 mb-4">{{ textbook.author }}</p>

          <dl class="space-y-2 text-sm">
            <div class="flex">
              <dt class="w-24 text-gray-500">出版社：</dt>
              <dd class="text-gray-700">{{ textbook.publisher || '—' }}</dd>
            </div>
            <div class="flex">
              <dt class="w-24 text-gray-500">ISBN：</dt>
              <dd class="text-gray-700">{{ textbook.isbn || '—' }}</dd>
            </div>
            <div class="flex">
              <dt class="w-24 text-gray-500">价格：</dt>
              <dd class="text-gray-700">{{ textbook.price ? `¥${textbook.price}` : '—' }}</dd>
            </div>
            <div class="flex" v-if="textbook.course">
              <dt class="w-24 text-gray-500">课程：</dt>
              <dd class="text-gray-700">{{ textbook.course.name }}</dd>
            </div>
            <div class="flex" v-if="textbook.class">
              <dt class="w-24 text-gray-500">班级：</dt>
              <dd class="text-gray-700">{{ textbook.class.name }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- 简介 -->
      <div v-if="textbook.description" class="p-6 border-t">
        <h2 class="text-lg font-bold text-gray-800 mb-3">内容简介</h2>
        <p class="text-gray-600 leading-relaxed">{{ textbook.description }}</p>
      </div>
    </div>
  </div>
</template>
