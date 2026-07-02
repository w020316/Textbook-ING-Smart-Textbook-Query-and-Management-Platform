// API 限流中间件 - 内存滑动窗口
// 按 key（IP+路径）限流，每分钟最大请求数

const WINDOW_MS = 60 * 1000 // 1分钟窗口
const buckets = new Map<string, number[]>() // key -> 时间戳数组

// 定期清理过期记录（避免内存泄漏）
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5分钟清理一次
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, times] of buckets) {
    const valid = times.filter(t => now - t < WINDOW_MS)
    if (valid.length === 0) {
      buckets.delete(key)
    } else {
      buckets.set(key, valid)
    }
  }
}

/**
 * 检查是否允许请求
 * @param key 限流 key（如 IP + 接口路径）
 * @param maxPerMinute 每分钟最大请求数
 * @returns true=允许, false=被限流
 */
export function rateLimit(key: string, maxPerMinute: number): boolean {
  cleanup()
  const now = Date.now()
  const times = buckets.get(key) || []
  // 过滤窗口内的时间戳
  const valid = times.filter(t => now - t < WINDOW_MS)
  if (valid.length >= maxPerMinute) {
    buckets.set(key, valid)
    return false
  }
  valid.push(now)
  buckets.set(key, valid)
  return true
}
