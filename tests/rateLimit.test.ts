import { describe, it, expect, beforeEach, vi } from 'vitest'

let rateLimit: (key: string, maxPerMinute: number) => boolean

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../api/_rateLimit.js')
  rateLimit = mod.rateLimit
})

describe('限流中间件', () => {
  describe('基本限流', () => {
    it('未超限时应允许请求', () => {
      expect(rateLimit('ip1:/api/test', 10)).toBe(true)
    })

    it('相同 key 达到上限后应拒绝', () => {
      const key = 'ip2:/api/login'
      for (let i = 0; i < 5; i++) {
        expect(rateLimit(key, 5)).toBe(true)
      }
      // 第 6 次应该被拒绝
      expect(rateLimit(key, 5)).toBe(false)
    })

    it('不同 key 应独立计数', () => {
      // key1 用 3 次
      for (let i = 0; i < 3; i++) rateLimit('ip1:/api/a', 5)
      // key2 用 2 次
      for (let i = 0; i < 2; i++) rateLimit('ip2:/api/a', 5)

      // key1 还能 2 次
      expect(rateLimit('ip1:/api/a', 5)).toBe(true)
      expect(rateLimit('ip1:/api/a', 5)).toBe(true)
      expect(rateLimit('ip1:/api/a', 5)).toBe(false)

      // key2 还能 3 次
      expect(rateLimit('ip2:/api/a', 5)).toBe(true)
    })
  })

  describe('滑动窗口', () => {
    it('窗口过期后应重置计数', () => {
      vi.useFakeTimers()
      const key = 'ip3:/api/test'

      // 用完 3 次
      for (let i = 0; i < 3; i++) rateLimit(key, 3)
      expect(rateLimit(key, 3)).toBe(false)

      // 快进 61 秒（超过 1 分钟窗口）
      vi.advanceTimersByTime(61 * 1000)

      // 应该可以再次请求
      expect(rateLimit(key, 3)).toBe(true)
      vi.useRealTimers()
    })

    it('窗口内部分请求过期应正确计算剩余次数', () => {
      vi.useFakeTimers()
      const key = 'ip4:/api/test'

      // t=0: 用 2 次
      rateLimit(key, 5)
      rateLimit(key, 5)

      // t=30s: 用 1 次
      vi.advanceTimersByTime(30 * 1000)
      rateLimit(key, 5)

      // t=61s: t=0 的 2 次已过期，只剩 t=30s 的 1 次
      vi.advanceTimersByTime(31 * 1000)

      // 应该还能用 4 次（5 - 1 = 4）
      expect(rateLimit(key, 5)).toBe(true)
      expect(rateLimit(key, 5)).toBe(true)
      expect(rateLimit(key, 5)).toBe(true)
      expect(rateLimit(key, 5)).toBe(true)
      // 第 5 次达到上限
      expect(rateLimit(key, 5)).toBe(false)
      vi.useRealTimers()
    })
  })

  describe('边界情况', () => {
    it('maxPerMinute=1 时应只允许 1 次', () => {
      expect(rateLimit('ip5:/api/checkin', 1)).toBe(true)
      expect(rateLimit('ip5:/api/checkin', 1)).toBe(false)
    })

    it('maxPerMinute=100 时应允许 100 次', () => {
      for (let i = 0; i < 100; i++) {
        expect(rateLimit('ip6:/api/list', 100)).toBe(true)
      }
      expect(rateLimit('ip6:/api/list', 100)).toBe(false)
    })
  })
})
