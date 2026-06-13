/**
 * Minimal Lexical → HTML serializer for the rich-text coming from Payload.
 * Handles the node types the editor produces by default (paragraph, heading,
 * list, quote, link, line break, formatted text). Extend as you add features.
 */

type LexNode = {
  type: string
  tag?: string
  text?: string
  format?: number | string
  children?: LexNode[]
  listType?: string
  fields?: { url?: string; newTab?: boolean }
  url?: string
  [key: string]: unknown
}

const IS_BOLD = 1
const IS_ITALIC = 1 << 1
const IS_STRIKETHROUGH = 1 << 2
const IS_UNDERLINE = 1 << 3
const IS_CODE = 1 << 4

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderText(node: LexNode): string {
  let text = escapeHtml(node.text ?? '')
  const format = typeof node.format === 'number' ? node.format : 0
  if (format & IS_CODE) text = `<code>${text}</code>`
  if (format & IS_BOLD) text = `<strong>${text}</strong>`
  if (format & IS_ITALIC) text = `<em>${text}</em>`
  if (format & IS_UNDERLINE) text = `<u>${text}</u>`
  if (format & IS_STRIKETHROUGH) text = `<s>${text}</s>`
  return text
}

function renderChildren(children?: LexNode[]): string {
  return (children ?? []).map(renderNode).join('')
}

function renderNode(node: LexNode): string {
  switch (node.type) {
    case 'text':
      return renderText(node)
    case 'linebreak':
      return '<br />'
    case 'paragraph': {
      const inner = renderChildren(node.children)
      return inner ? `<p>${inner}</p>` : ''
    }
    case 'heading': {
      const tag = node.tag && /^h[1-6]$/.test(node.tag) ? node.tag : 'h2'
      return `<${tag}>${renderChildren(node.children)}</${tag}>`
    }
    case 'quote':
      return `<blockquote>${renderChildren(node.children)}</blockquote>`
    case 'list': {
      const tag = node.listType === 'number' ? 'ol' : 'ul'
      return `<${tag}>${renderChildren(node.children)}</${tag}>`
    }
    case 'listitem':
      return `<li>${renderChildren(node.children)}</li>`
    case 'link': {
      const url = node.fields?.url || node.url || '#'
      const target = node.fields?.newTab ? ' target="_blank" rel="noopener"' : ''
      return `<a href="${escapeHtml(url)}"${target}>${renderChildren(node.children)}</a>`
    }
    default:
      // Unknown node: render its children so content is never silently dropped.
      return renderChildren(node.children)
  }
}

export function lexicalToHtml(state: unknown): string {
  const root = (state as { root?: LexNode })?.root
  if (!root || !root.children) return ''
  return renderChildren(root.children)
}
