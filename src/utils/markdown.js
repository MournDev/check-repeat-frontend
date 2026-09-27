import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true
})

export function renderMarkdown(text) {
  if (!text) return ''
  const rawHtml = md.render(text)
  return DOMPurify.sanitize(rawHtml)
}

export function sanitizeHtml(html) {
  if (!html) return ''
  return DOMPurify.sanitize(html)
}
