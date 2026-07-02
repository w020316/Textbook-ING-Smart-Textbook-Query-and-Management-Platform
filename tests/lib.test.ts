import { describe, it, expect, beforeEach } from 'vitest'

// 测试 _lib.ts 中的工具函数（不依赖数据库的部分）
let hashPassword: (pwd: string) => Promise<string>
let comparePassword: (pwd: string, hash: string) => Promise<boolean>
let signToken: (userId: string) => string
let verifyToken: (token: string) => { userId: string } | null
let generateCode: () => string
let sendSuccess: (res: any, data?: any, message?: string) => any
let sendError: (res: any, message: string, code?: number, status?: number) => any

// Mock res 对象
function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null as any,
    status(code: number) { this.statusCode = code; return this },
    json(data: any) { this.body = data; return this },
  }
  return res
}

beforeEach(async () => {
  const mod = await import('../api/_lib.js')
  hashPassword = mod.hashPassword
  comparePassword = mod.comparePassword
  signToken = mod.signToken
  verifyToken = mod.verifyToken
  generateCode = mod.generateCode
  sendSuccess = mod.sendSuccess
  sendError = mod.sendError
})

describe('工具库 _lib.ts', () => {
  describe('密码加密', () => {
    it('hashPassword 应该返回 bcrypt 哈希', async () => {
      const hash = await hashPassword('test123')
      expect(hash).not.toBe('test123')
      expect(hash).toMatch(/^\$2[aby]\$/)
    })

    it('comparePassword 应该验证正确密码', async () => {
      const hash = await hashPassword('mypassword')
      expect(await comparePassword('mypassword', hash)).toBe(true)
    })

    it('comparePassword 应该拒绝错误密码', async () => {
      const hash = await hashPassword('correct')
      expect(await comparePassword('wrong', hash)).toBe(false)
    })

    it('相同密码两次哈希结果应不同（盐值随机）', async () => {
      const h1 = await hashPassword('same')
      const h2 = await hashPassword('same')
      expect(h1).not.toBe(h2)
    })
  })

  describe('JWT 签发与验证', () => {
    it('signToken 应返回非空字符串', () => {
      const token = signToken('user-123')
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT 三段式
    })

    it('verifyToken 应正确解析有效 token', () => {
      const token = signToken('user-456')
      const payload = verifyToken(token)
      expect(payload).not.toBeNull()
      expect(payload!.userId).toBe('user-456')
    })

    it('verifyToken 对无效 token 应返回 null', () => {
      expect(verifyToken('invalid-token')).toBeNull()
    })

    it('verifyToken 对空字符串应返回 null', () => {
      expect(verifyToken('')).toBeNull()
    })

    it('不同 userId 签发的 token 应可区分', () => {
      const t1 = signToken('user-a')
      const t2 = signToken('user-b')
      expect(verifyToken(t1)!.userId).toBe('user-a')
      expect(verifyToken(t2)!.userId).toBe('user-b')
    })
  })

  describe('验证码生成', () => {
    it('generateCode 应返回 6 位数字字符串', () => {
      const code = generateCode()
      expect(code).toMatch(/^\d{6}$/)
    })

    it('generateCode 应在 100000-999999 范围内', () => {
      for (let i = 0; i < 100; i++) {
        const code = parseInt(generateCode())
        expect(code).toBeGreaterThanOrEqual(100000)
        expect(code).toBeLessThanOrEqual(999999)
      }
    })
  })

  describe('响应工具函数', () => {
    it('sendSuccess 应返回 200 + code:0 + data', () => {
      const res = createMockRes()
      sendSuccess(res, { id: 1 }, 'ok')
      expect(res.statusCode).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.message).toBe('ok')
      expect(res.body.data).toEqual({ id: 1 })
      expect(res.body.timestamp).toBeDefined()
    })

    it('sendSuccess 默认 message 为 success', () => {
      const res = createMockRes()
      sendSuccess(res, null)
      expect(res.body.message).toBe('success')
      expect(res.body.data).toBeNull()
    })

    it('sendError 应返回指定状态码 + 错误信息', () => {
      const res = createMockRes()
      sendError(res, '参数错误', 1, 400)
      expect(res.statusCode).toBe(400)
      expect(res.body.code).toBe(1)
      expect(res.body.message).toBe('参数错误')
      expect(res.body.data).toBeNull()
    })

    it('sendError 默认 code=1, status=400', () => {
      const res = createMockRes()
      sendError(res, '错误')
      expect(res.statusCode).toBe(400)
      expect(res.body.code).toBe(1)
    })
  })
})
