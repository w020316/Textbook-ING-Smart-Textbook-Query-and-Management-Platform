// 认证相关 API 处理器
import { prisma, hashPassword, comparePassword, signToken, sendSuccess, sendError, generateCode, getRequestBody } from './_lib.js'
import { sendEmail } from './_email.js'

// 密码强度校验
function validatePassword(password: string): string | null {
  if (!password || password.length < 8) return '密码长度至少8位'
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return '密码需包含字母和数字'
  return null
}

// 发送验证码
export async function handleSendCode(req: any, res: any, params: any, query: URLSearchParams) {
  const body = await getRequestBody(req)
  const email = body.email?.trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, '邮箱格式不正确')
  }

  // 检查是否已注册（注册场景）
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing && !query.get('type')) {
    return sendError(res, '该邮箱已注册')
  }

  // 生成验证码
  const code = generateCode()

  // 清理旧验证码，创建新的
  const type = query.get('type') === 'reset' ? 'RESET' : 'REGISTER'
  await prisma.verifyToken.deleteMany({ where: { email, type } })
  await prisma.verifyToken.create({
    data: {
      email,
      code,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  // 发送邮件（失败时降级为开发模式返回验证码）
  const isDev = process.env.NODE_ENV !== 'production'
  let emailSent = false
  try {
    await sendEmail(email, '教材ING 验证码', `您的验证码是：${code}，10分钟内有效。`)
    emailSent = true
  } catch (e) {
    console.error('[Email] 发送失败:', e)
  }

  return sendSuccess(res, isDev || !emailSent ? { code } : null, '验证码已发送')
}

// 注册
export async function handleRegister(req: any, res: any) {
  const body = await getRequestBody(req)
  const { email, password, code, name } = body

  if (!email || !password || !code) {
    return sendError(res, '请填写完整信息')
  }
  const pwdError = validatePassword(password)
  if (pwdError) return sendError(res, pwdError)

  // 验证码校验
  const token = await prisma.verifyToken.findFirst({
    where: { email, code, type: 'REGISTER', used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!token) {
    return sendError(res, '验证码错误或已过期')
  }

  // 检查邮箱
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return sendError(res, '该邮箱已注册')
  }

  // 创建用户
  const hashedPassword = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      points: 100,
      emailVerified: new Date(),
    },
  })

  // 赠送积分记录
  await prisma.pointRecord.create({
    data: { userId: user.id, amount: 100, reason: '注册赠送', balance: 100 },
  })

  // 标记验证码已使用
  await prisma.verifyToken.update({ where: { id: token.id }, data: { used: true } })

  // 生成 JWT
  const jwtToken = signToken(user.id)

  return sendSuccess(res, {
    token: jwtToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, points: user.points },
  }, '注册成功')
}

// 登录
export async function handleLogin(req: any, res: any) {
  const body = await getRequestBody(req)
  const { email, password } = body

  if (!email || !password) {
    return sendError(res, '请输入邮箱和密码')
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return sendError(res, '邮箱或密码错误')
  }

  const valid = await comparePassword(password, user.password)
  if (!valid) {
    return sendError(res, '邮箱或密码错误')
  }

  const jwtToken = signToken(user.id)

  return sendSuccess(res, {
    token: jwtToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, points: user.points },
  }, '登录成功')
}

// 退出登录
export async function handleLogout(req: any, res: any) {
  // JWT 无状态，前端清理 token 即可；后端仅记录日志
  return sendSuccess(res, null, '已退出登录')
}

// 忘记密码
export async function handleForgotPassword(req: any, res: any) {
  const body = await getRequestBody(req)
  const email = body.email?.trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, '邮箱格式不正确')
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return sendError(res, '该邮箱未注册')
  }

  const code = generateCode()
  await prisma.verifyToken.deleteMany({ where: { email, type: 'RESET' } })
  await prisma.verifyToken.create({
    data: { email, code, type: 'RESET', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  })

  // 发送邮件
  const isDev = process.env.NODE_ENV !== 'production'
  let emailSent = false
  try {
    await sendEmail(email, '教材ING 密码重置', `您的重置验证码是：${code}，10分钟内有效。`)
    emailSent = true
  } catch (e) {
    console.error('[Email] 发送失败:', e)
  }

  return sendSuccess(res, isDev || !emailSent ? { code } : null, '重置验证码已发送')
}

// 重置密码
export async function handleResetPassword(req: any, res: any) {
  const body = await getRequestBody(req)
  const { email, code, newPassword } = body

  if (!email || !code || !newPassword) {
    return sendError(res, '请填写完整信息')
  }
  const pwdError = validatePassword(newPassword)
  if (pwdError) return sendError(res, pwdError)

  const token = await prisma.verifyToken.findFirst({
    where: { email, code, type: 'RESET', used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!token) {
    return sendError(res, '验证码错误或已过期')
  }

  const hashedPassword = await hashPassword(newPassword)
  await prisma.user.update({ where: { email }, data: { password: hashedPassword } })
  await prisma.verifyToken.update({ where: { id: token.id }, data: { used: true } })

  return sendSuccess(res, null, '密码重置成功')
}

// 当前用户信息
export async function handleMe(req: any, res: any) {
  const user = (req as any)._user
  return sendSuccess(res, user)
}
