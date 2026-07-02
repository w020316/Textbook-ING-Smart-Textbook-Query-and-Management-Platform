import { describe, it, expect, beforeEach, vi } from 'vitest'

// 由于 _cache.ts 使用模块级状态（Map），需要在每个测试前重置模块
let getCache: <T>(key: string) => T | null
let setCache: <T>(key: string, value: T, ttlSeconds?: number) => void
let invalidateCache: (prefix: string) => void

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../api/_cache.js')
  getCache = mod.getCache
  setCache = mod.setCache
  invalidateCache = mod.invalidateCache
})

describe('LRU+TTL 缓存', () => {
  describe('setCache / getCache 基本操作', () => {
    it('应该存入并读取缓存值', () => {
      setCache('key1', { name: 'test' })
      const result = getCache<{ name: string }>('key1')
      expect(result).toEqual({ name: 'test' })
    })

    it('未命中的 key 应返回 null', () => {
      const result = getCache('nonexistent')
      expect(result).toBeNull()
    })

    it('应该支持不同类型的数据', () => {
      setCache('string', 'hello')
      setCache('number', 42)
      setCache('array', [1, 2, 3])
      setCache('boolean', true)

      expect(getCache<string>('string')).toBe('hello')
      expect(getCache<number>('number')).toBe(42)
      expect(getCache<number[]>('array')).toEqual([1, 2, 3])
      expect(getCache<boolean>('boolean')).toBe(true)
    })
  })

  describe('TTL 过期机制', () => {
    it('应该在 TTL 内返回数据', () => {
      setCache('ttl-key', 'value', 60)
      expect(getCache('ttl-key')).toBe('value')
    })

    it('过期后应返回 null', () => {
      vi.useFakeTimers()
      setCache('expire-key', 'data', 60)
      // 快进 61 秒
      vi.advanceTimersByTime(61 * 1000)
      expect(getCache('expire-key')).toBeNull()
      vi.useRealTimers()
    })

    it('默认 TTL 应为 60 秒', () => {
      vi.useFakeTimers()
      setCache('default-ttl', 'val')
      // 59秒内应该还在
      vi.advanceTimersByTime(59 * 1000)
      expect(getCache('default-ttl')).toBe('val')
      // 61秒后应该过期
      vi.advanceTimersByTime(2 * 1000)
      expect(getCache('default-ttl')).toBeNull()
      vi.useRealTimers()
    })
  })

  describe('invalidateCache 批量失效', () => {
    it('应该按前缀清除缓存', () => {
      setCache('get:/api/stats:1', { count: 10 })
      setCache('get:/api/semesters:1', [{ id: 1 }])
      setCache('get:/api/news:1', [{ id: 1 }])
      setCache('user:session:1', { userId: 'u1' })

      invalidateCache('get:')

      expect(getCache('get:/api/stats:1')).toBeNull()
      expect(getCache('get:/api/semesters:1')).toBeNull()
      expect(getCache('get:/api/news:1')).toBeNull()
      // 不匹配前缀的不受影响
      expect(getCache('user:session:1')).toEqual({ userId: 'u1' })
    })

    it('空前缀应清除所有缓存', () => {
      setCache('key1', 'val1')
      setCache('key2', 'val2')
      setCache('prefix:key3', 'val3')

      invalidateCache('')

      expect(getCache('key1')).toBeNull()
      expect(getCache('key2')).toBeNull()
      expect(getCache('prefix:key3')).toBeNull()
    })
  })

  describe('LRU 淘汰机制', () => {
    it('超过容量时应该淘汰最久未访问的条目', () => {
      // 填满 100 个条目
      for (let i = 0; i < 100; i++) {
        setCache(`key-${i}`, i)
      }
      // 所有条目应该都存在
      expect(getCache('key-0')).toBe(0)
      expect(getCache('key-99')).toBe(99)

      // 添加第 101 个，应该淘汰最久未访问的
      setCache('key-100', 100)
      // key-1 应该被淘汰（因为 key-0 刚被访问过）
      expect(getCache('key-1')).toBeNull()
      // key-0 应该还在（刚被访问过）
      expect(getCache('key-0')).toBe(0)
      // 新条目应该存在
      expect(getCache('key-100')).toBe(100)
    })

    it('读取操作应该更新 LRU 顺序', () => {
      // 添加 3 个条目
      setCache('a', 1)
      setCache('b', 2)
      setCache('c', 3)

      // 读取 a，使其成为最近访问
      getCache('a')

      // 现在再添加 98 个，让 b 成为最久未访问的被淘汰
      for (let i = 0; i < 98; i++) {
        setCache(`extra-${i}`, i)
      }

      // a 刚被访问，应该还在
      expect(getCache('a')).toBe(1)
    })
  })

  describe('更新已存在的 key', () => {
    it('应该更新值而不增加条目数', () => {
      setCache('update-key', 'old')
      setCache('update-key', 'new')

      expect(getCache('update-key')).toBe('new')
    })
  })
})
