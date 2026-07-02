import { describe, it, expect } from 'vitest'
import { sanitizeHtml, sanitizeRichHtml } from '../api/_sanitize.js'

describe('XSS 清洗', () => {
  describe('sanitizeHtml 纯文本转义', () => {
    it('应该转义 < > 字符', () => {
      expect(sanitizeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;')
    })

    it('应该转义 & 字符', () => {
      expect(sanitizeHtml('a & b')).toBe('a &amp; b')
    })

    it('应该转义双引号', () => {
      expect(sanitizeHtml('say "hello"')).toBe('say &quot;hello&quot;')
    })

    it('应该转义单引号', () => {
      expect(sanitizeHtml("it's")).toBe('it&#x27;s')
    })

    it('应该转义斜杠', () => {
      expect(sanitizeHtml('path/to/file')).toBe('path&#x2F;to&#x2F;file')
    })

    it('空输入应返回空字符串', () => {
      expect(sanitizeHtml('')).toBe('')
      expect(sanitizeHtml(undefined as any)).toBe('')
    })

    it('普通文本应不受影响', () => {
      expect(sanitizeHtml('Hello World 你好世界')).toBe('Hello World 你好世界')
    })

    it('应该转义所有特殊字符的组合', () => {
      const input = '<div onclick="alert(\'xss\')">test</div>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result).not.toContain('"')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
      expect(result).toContain('&quot;')
    })
  })

  describe('sanitizeRichHtml 富文本清洗', () => {
    it('应该移除 script 标签', () => {
      const input = '<p>正文</p><script>alert(1)</script>'
      const result = sanitizeRichHtml(input)
      expect(result).not.toContain('<script')
      expect(result).not.toContain('alert(1)')
      expect(result).toContain('<p>正文</p>')
    })

    it('应该移除 style 标签', () => {
      const input = '<style>body{color:red}</style><p>text</p>'
      const result = sanitizeRichHtml(input)
      expect(result).not.toContain('<style')
      expect(result).toContain('<p>text</p>')
    })

    it('应该移除 iframe 标签', () => {
      const input = '<iframe src="evil.com"></iframe><p>safe</p>'
      const result = sanitizeRichHtml(input)
      expect(result).not.toContain('<iframe')
      expect(result).toContain('<p>safe</p>')
    })

    it('应该移除事件处理器属性', () => {
      const input = '<p onclick="alert(1)">text</p>'
      const result = sanitizeRichHtml(input)
      expect(result).not.toContain('onclick')
    })

    it('应该移除 onerror 事件', () => {
      const input = '<img src="x" onerror="alert(1)">'
      const result = sanitizeRichHtml(input)
      expect(result).not.toContain('onerror')
    })

    it('应该移除 javascript: 协议的 href', () => {
      const input = '<a href="javascript:alert(1)">link</a>'
      const result = sanitizeRichHtml(input)
      expect(result).not.toContain('javascript:')
    })

    it('应该保留安全的链接', () => {
      const input = '<a href="https://example.com">link</a>'
      const result = sanitizeRichHtml(input)
      expect(result).toContain('href="https://example.com"')
    })

    it('应该保留安全的 img 标签', () => {
      const input = '<img src="https://example.com/img.png" alt="图片">'
      const result = sanitizeRichHtml(input)
      expect(result).toContain('src="https://example.com/img.png"')
      expect(result).toContain('alt="图片"')
    })

    it('空输入应返回空字符串', () => {
      expect(sanitizeRichHtml('')).toBe('')
    })

    it('应该保留段落和标题标签', () => {
      const input = '<h1>标题</h1><p>段落内容</p>'
      const result = sanitizeRichHtml(input)
      expect(result).toBe('<h1>标题</h1><p>段落内容</p>')
    })
  })
})
