// 全局 toast 通知 composable
// 使用单例模式，所有后台组件共享同一个 toast 队列
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
  duration: number
}

const toasts = ref<ToastItem[]>([])
let counter = 0

function show(message: string, type: ToastType = 'info', duration = 3000) {
  const id = ++counter
  toasts.value.push({ id, type, message, duration })
  if (duration > 0) {
    setTimeout(() => remove(id), duration)
  }
  return id
}

function remove(id: number) {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx > -1) toasts.value.splice(idx, 1)
}

function success(message: string, duration?: number) {
  return show(message, 'success', duration)
}

function error(message: string, duration?: number) {
  return show(message, 'error', duration ?? 5000)
}

function warning(message: string, duration?: number) {
  return show(message, 'warning', duration)
}

function info(message: string, duration?: number) {
  return show(message, 'info', duration)
}

export function useToast() {
  return { toasts, show, remove, success, error, warning, info }
}
