<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">用户管理</h1>
        <p class="mt-1 text-sm text-gray-500">管理平台用户账号、角色与积分</p>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
      <input
        v-model="keyword"
        type="text"
        placeholder="搜索邮箱或姓名"
        class="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        @keyup.enter="handleSearch"
      />
      <select
        v-model="roleFilter"
        class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">全部角色</option>
        <option value="STUDENT">学生</option>
        <option value="TEACHER">教师</option>
        <option value="ADMIN">管理员</option>
      </select>
      <button
        type="button"
        class="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600"
        @click="handleSearch"
      >
        查询
      </button>
      <button
        type="button"
        class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
        @click="handleReset"
      >
        重置
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="flex flex-col items-center py-20 text-gray-400">
      <svg class="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
      </svg>
      <p class="mt-3 text-sm">加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
      {{ error }}
    </div>

    <template v-else>
      <!-- 表格 -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">用户</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">角色</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">积分</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">邮箱验证</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">注册时间</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-if="!list.length">
              <td colspan="6" class="px-6 py-12 text-center text-sm text-gray-400">暂无用户数据</td>
            </tr>
            <tr v-for="item in list" :key="item.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <img
                    v-if="item.avatar"
                    :src="item.avatar"
                    :alt="item.name"
                    class="w-8 h-8 rounded-full object-cover"
                  />
                  <span
                    v-else
                    class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white flex items-center justify-center text-sm font-medium"
                  >
                    {{ item.name.charAt(0).toUpperCase() }}
                  </span>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ item.name }}</p>
                    <p class="text-xs text-gray-500">{{ item.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex px-2 py-0.5 text-xs rounded-full font-medium"
                  :class="roleStyle(item.role)"
                >
                  {{ roleLabel(item.role) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 font-medium">{{ item.points }}</td>
              <td class="px-6 py-4">
                <span
                  v-if="item.emailVerified"
                  class="inline-flex items-center gap-1 text-xs text-emerald-600"
                >
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  已验证
                </span>
                <span v-else class="text-xs text-gray-400">未验证</span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{{ formatDate(item.createdAt) }}</td>
              <td class="px-6 py-4 text-right text-sm space-x-2 whitespace-nowrap">
                <button type="button" class="text-primary-600 hover:text-primary-700 font-medium" @click="openRoleModal(item)">改角色</button>
                <button type="button" class="text-amber-600 hover:text-amber-700 font-medium" @click="openPointsModal(item)">改积分</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <Pagination
        :current="page"
        :total="total"
        :page-size="pageSize"
        @change="handlePageChange"
      />
    </template>

    <!-- 修改角色弹窗 -->
    <Modal :show="roleModal.show" title="修改用户角色" @close="closeRoleModal">
      <div class="space-y-4">
        <div class="text-sm text-gray-600">
          用户：<span class="font-medium text-gray-900">{{ roleModal.user?.name }}</span>
          （{{ roleModal.user?.email }}）
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">角色</label>
          <select
            v-model="roleModal.role"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="STUDENT">学生</option>
            <option value="TEACHER">教师</option>
            <option value="ADMIN">管理员</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button type="button" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200" :disabled="submitting" @click="closeRoleModal">取消</button>
        <button type="button" class="px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2" :disabled="submitting" @click="submitRole">
          <svg v-if="submitting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
          </svg>
          {{ submitting ? '保存中...' : '确认' }}
        </button>
      </template>
    </Modal>

    <!-- 调整积分弹窗 -->
    <Modal :show="pointsModal.show" title="调整用户积分" @close="closePointsModal">
      <div class="space-y-4">
        <div class="text-sm text-gray-600">
          用户：<span class="font-medium text-gray-900">{{ pointsModal.user?.name }}</span>
          （当前积分：<span class="font-medium text-amber-600">{{ pointsModal.user?.points }}</span>）
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">增减值（正数为增加，负数为扣除）</label>
          <input
            v-model.number="pointsModal.amount"
            type="number"
            placeholder="例如：10 或 -5"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">原因</label>
          <input
            v-model="pointsModal.reason"
            type="text"
            placeholder="例如：活动奖励 / 违规扣除"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <template #footer>
        <button type="button" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200" :disabled="submitting" @click="closePointsModal">取消</button>
        <button type="button" class="px-4 py-2 text-sm text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2" :disabled="submitting" @click="submitPoints">
          <svg v-if="submitting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
          </svg>
          {{ submitting ? '调整中...' : '确认调整' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get, put, post } from '@/utils/request'
import Pagination from '@/components/Pagination.vue'
import Modal from '@/admin/components/Modal.vue'
import { useToast } from '@/admin/composables/useToast'
import type { User, Role, PaginatedResponse } from '@/types'

const toast = useToast()

interface AdminUser extends User {
  emailVerified?: string | null
}

const list = ref<AdminUser[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')

const keyword = ref('')
const roleFilter = ref('')

async function fetchList() {
  loading.value = true
  error.value = ''
  try {
    const res = await get<PaginatedResponse<AdminUser>>('/admin/users', {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      role: roleFilter.value || undefined,
    })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载用户列表失败'
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchList()
}

function handleReset() {
  keyword.value = ''
  roleFilter.value = ''
  page.value = 1
  fetchList()
}

function handlePageChange(p: number) {
  page.value = p
  fetchList()
}

function roleLabel(role: Role): string {
  return { STUDENT: '学生', TEACHER: '教师', ADMIN: '管理员' }[role] || role
}

function roleStyle(role: Role): string {
  return {
    STUDENT: 'bg-blue-50 text-blue-600',
    TEACHER: 'bg-emerald-50 text-emerald-600',
    ADMIN: 'bg-purple-50 text-purple-600',
  }[role] || 'bg-gray-50 text-gray-600'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// ==================== 角色弹窗 ====================
const roleModal = ref<{ show: boolean; user: AdminUser | null; role: Role }>({
  show: false,
  user: null,
  role: 'STUDENT',
})

function openRoleModal(user: AdminUser) {
  roleModal.value = { show: true, user, role: user.role }
}

function closeRoleModal() {
  if (submitting.value) return
  roleModal.value.show = false
}

async function submitRole() {
  if (!roleModal.value.user) return
  submitting.value = true
  try {
    await put(`/admin/users/${roleModal.value.user.id}`, { role: roleModal.value.role })
    toast.success(`已将「${roleModal.value.user.name}」的角色修改为「${roleLabel(roleModal.value.role)}」`)
    await fetchList()
    closeRoleModal()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '修改角色失败')
  } finally {
    submitting.value = false
  }
}

// ==================== 积分弹窗 ====================
const pointsModal = ref<{ show: boolean; user: AdminUser | null; amount: number | null; reason: string }>({
  show: false,
  user: null,
  amount: null,
  reason: '',
})

function openPointsModal(user: AdminUser) {
  pointsModal.value = { show: true, user, amount: null, reason: '' }
}

function closePointsModal() {
  if (submitting.value) return
  pointsModal.value.show = false
}

async function submitPoints() {
  if (!pointsModal.value.user) return
  if (!pointsModal.value.amount || typeof pointsModal.value.amount !== 'number') {
    toast.warning('请输入有效的积分增减值')
    return
  }
  submitting.value = true
  try {
    await post(`/admin/users/${pointsModal.value.user.id}/points`, {
      amount: pointsModal.value.amount,
      reason: pointsModal.value.reason,
    })
    toast.success(`已为「${pointsModal.value.user.name}」调整积分 ${pointsModal.value.amount > 0 ? '+' : ''}${pointsModal.value.amount}`)
    await fetchList()
    closePointsModal()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '调整积分失败')
  } finally {
    submitting.value = false
  }
}

onMounted(fetchList)
</script>
