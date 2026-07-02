// API 共享工具库 - Prisma / Auth / Response
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// ==================== Prisma Client ====================
// 在 Serverless 环境中复用全局 Prisma 实例，避免每次调用创建新连接
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
})

// 生产环境也缓存到 global，避免 Serverless 函数重复创建连接
globalForPrisma.prisma = prisma

// ==================== Auth ====================
const JWT_SECRET = process.env.JWT_SECRET || 'textbook-ing-dev-secret-2026'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function getUserFromRequest(req: any) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  if (!payload) return null
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, avatar: true, points: true, emailVerified: true },
  })
  return user
}

export function requireAuth(req: any) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  return payload
}

// ==================== Response ====================
export function sendSuccess(res: any, data: any = null, message: string = 'success') {
  return res.status(200).json({
    code: 0,
    message,
    data,
    timestamp: Date.now(),
  })
}

export function sendError(res: any, message: string, code: number = 1, status: number = 400) {
  return res.status(status).json({
    code,
    message,
    data: null,
    timestamp: Date.now(),
  })
}

// ==================== Utils ====================
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function getRequestBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    if (req.body) {
      resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body)
    } else {
      let data = ''
      req.on('data', (chunk: any) => { data += chunk })
      req.on('end', () => {
        try { resolve(JSON.parse(data || '{}')) }
        catch { resolve({}) }
      })
    }
  })
}
