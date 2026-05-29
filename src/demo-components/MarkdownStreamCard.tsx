/**
 * MarkdownStreamCard — Markdown 流式输出演示卡片
 *
 * 模拟 AI 打字机输出效果：以指定速度逐字显示 markdown 内容，
 * 光标随末尾闪烁，完成后可一键重播或中途跳过。
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { RotateCcw, FastForward } from 'lucide-react'

interface Props {
  /** 要流式输出的完整 markdown 文本 */
  content: string
  /** 每个 tick 输出的字符数，数值越大越快（默认 3） */
  speed?: number
  /** tick 间隔 ms，数值越小越快（默认 28） */
  tickMs?: number
}

export default function MarkdownStreamCard({
  content,
  speed = 3,
  tickMs = 28,
}: Props) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const posRef = useRef(0)

  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    posRef.current = 0
    setDisplayed('')
    setDone(false)

    timerRef.current = setInterval(() => {
      posRef.current += speed
      if (posRef.current >= content.length) {
        setDisplayed(content)
        setDone(true)
        if (timerRef.current) clearInterval(timerRef.current)
      } else {
        setDisplayed(content.slice(0, posRef.current))
      }
    }, tickMs)
  }, [content, speed, tickMs])

  useEffect(() => {
    start()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [start])

  const handleSkip = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setDisplayed(content)
    setDone(true)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div className="chat-agent-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {displayed}
        </ReactMarkdown>
      </div>
      {!done && (
        <div className="chat-typing-indicator" style={{ paddingTop: 10 }}>
          <span className="spinner" /> AI 正在分析...
        </div>
      )}

      <div style={{
        marginTop: 12,
        display: 'flex',
        gap: 8,
        justifyContent: 'flex-end',
      }}>
        {!done ? (
          <button onClick={handleSkip} style={btnStyle}>
            <FastForward size={12} />
            跳过
          </button>
        ) : (
          <button onClick={start} style={btnStyle}>
            <RotateCcw size={12} />
            重播
          </button>
        )}
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  fontSize: 12,
  color: 'var(--text-muted)',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 6,
  cursor: 'pointer',
  lineHeight: 1.4,
}
