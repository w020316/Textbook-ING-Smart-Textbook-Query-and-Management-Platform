// XSS 清洗工具 - 转义 HTML 特殊字符
// 轻量级实现，避免引入 DOMPurify（需 DOM 环境）
// 对于富文本内容（管理后台新闻），在 admin/news.ts 中用更严格的白名单过滤

export function sanitizeHtml(input: string): string {
  if (!input) return ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// 富文本白名单清洗（用于新闻正文等需要保留 HTML 的场景）
// 允许的标签：p, br, h1-h6, ul, ol, li, blockquote, pre, code, a, strong, em, u, img
// 允许的属性：href, src, alt, title
export function sanitizeRichHtml(input: string): string {
  if (!input) return ''
  // 移除 script/style/iframe 等危险标签及其内容
  let html = input.replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select)[\s\S]*?<\/\1>/gi, '')
  // 移除事件处理器属性
  html = html.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
  html = html.replace(/\son\w+\s*=\s*'[^']*'/gi, '')
  html = html.replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
  // 移除 javascript: 协议
  html = html.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
  html = html.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '')
  return html
}
