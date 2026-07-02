// 邮件服务 - Resend API 封装
// 免费版 100 封/天，发信域默认 onboarding@resend.dev

const RESEND_API_URL = 'https://api.resend.com/emails'

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.MAIL_FROM || 'onboarding@resend.dev'

  // 未配置 API Key 时降级为 console 输出
  if (!apiKey) {
    console.log(`[Email Mock] to=${to}, subject=${subject}`)
    console.log(`[Email Mock] body=${html}`)
    return
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend API 错误 (${res.status}): ${text}`)
  }
}

// 验证码邮件模板
export function sendCodeEmail(to: string, code: string, purpose: 'register' | 'reset'): Promise<void> {
  const title = purpose === 'reset' ? '密码重置验证码' : '注册验证码'
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">教材ING ${title}</h2>
      <p>您好，您的${title}是：</p>
      <div style="font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; padding: 20px; background: #eff6ff; border-radius: 8px; letter-spacing: 4px;">${code}</div>
      <p style="color: #6b7280; font-size: 14px;">验证码 10 分钟内有效，请勿泄露给他人。</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #9ca3af; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
    </div>
  `
  return sendEmail(to, `教材ING ${title}`, html)
}
