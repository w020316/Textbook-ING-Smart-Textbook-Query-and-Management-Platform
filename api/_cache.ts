// 简单 LRU + TTL 缓存（用于公开 API 响应）
// 适用场景：首页统计、学期列表、学院列表等低频变更数据

interface CacheEntry<T> {
  value: T
  expiresAt: number
  // LRU 链表指针（用数组模拟双向链表的简化版）
  prev?: string
  next?: string
}

const MAX_SIZE = 100

const store = new Map<string, CacheEntry<unknown>>()
// LRU 顺序：head 为最近访问，tail 为最久未访问
let head: string | undefined
let tail: string | undefined

/**
 * 获取缓存值。命中时更新 LRU 顺序。
 */
export function getCache<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null

  // 过期检查
  if (Date.now() > entry.expiresAt) {
    removeKey(key)
    return null
  }

  // 提升到头部
  moveToHead(key)
  return entry.value
}

/**
 * 写入缓存。
 * @param ttlSeconds 有效期（秒），默认 60
 */
export function setCache<T>(key: string, value: T, ttlSeconds = 60): void {
  // 已存在则更新
  if (store.has(key)) {
    const entry = store.get(key) as CacheEntry<T>
    entry.value = value
    entry.expiresAt = Date.now() + ttlSeconds * 1000
    moveToHead(key)
    return
  }

  // 新增
  const entry: CacheEntry<T> = {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  }
  store.set(key, entry)
  prependToHead(key)

  // 容量淘汰：淘汰 tail
  while (store.size > MAX_SIZE && tail) {
    removeKey(tail)
  }
}

/**
 * 清除指定前缀的缓存（用于数据变更后主动失效）。
 */
export function invalidateCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      removeKey(key)
    }
  }
}

// ==================== LRU 链表操作 ====================

function moveToHead(key: string): void {
  if (head === key) return
  removeNode(key)
  prependToHead(key)
}

function prependToHead(key: string): void {
  const entry = store.get(key) as CacheEntry<unknown> | undefined
  if (!entry) return

  entry.prev = undefined
  entry.next = head
  if (head) {
    const headEntry = store.get(head) as CacheEntry<unknown> | undefined
    if (headEntry) headEntry.prev = key
  }
  head = key
  if (!tail) tail = key
}

function removeNode(key: string): void {
  const entry = store.get(key) as CacheEntry<unknown> | undefined
  if (!entry) return

  const { prev, next } = entry
  if (prev) {
    const prevEntry = store.get(prev) as CacheEntry<unknown> | undefined
    if (prevEntry) prevEntry.next = next
  } else {
    head = next
  }
  if (next) {
    const nextEntry = store.get(next) as CacheEntry<unknown> | undefined
    if (nextEntry) nextEntry.prev = prev
  } else {
    tail = prev
  }
  entry.prev = undefined
  entry.next = undefined
}

function removeKey(key: string): void {
  removeNode(key)
  store.delete(key)
}
