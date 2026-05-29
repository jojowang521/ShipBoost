/**
 * ScenarioSwitcher — 全局悬浮场景切换器
 *
 * - 32px 紫色半透明圆形按钮，全局固定浮层（z-index 9999）
 * - 默认位置：右上角
 * - 支持拖拽，松手后吸附到最近的左/右边缘
 * - 点击展开下拉列表，列出所有已注册场景
 * - 选中场景后：RESET 回 AI 首页，用户从首页重新选择进入
 */
import React, { useRef, useState, useEffect } from 'react'
import { useAppDispatch } from '../shared/store/AppContext'
import { getAllAgents } from '../scenarios/registry'
import { trackEvent } from '../shared/telemetry'

const SIZE = 32
const EDGE_MARGIN = 12

export function ScenarioSwitcher() {
  const dispatch = useAppDispatch()
  const visibleAgents = getAllAgents()

  // 默认贴右上角（lazy initializer 避免 SSR 问题）
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - SIZE - EDGE_MARGIN,
    y: 72,
  }))
  // 是否正在吸附（有 CSS transition）
  const [isSnapping, setIsSnapping] = useState(false)
  // 下拉展开状态
  const [open, setOpen] = useState(false)

  const wrapRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const moved = useRef(false)
  const startRef = useRef({ px: 0, py: 0, bx: 0, by: 0 })

  // ── 拖拽处理 ──────────────────────────────────────────────────────────────

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    dragging.current = true
    moved.current = false
    setIsSnapping(false)
    startRef.current = { px: e.clientX, py: e.clientY, bx: pos.x, by: pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return
    const dx = e.clientX - startRef.current.px
    const dy = e.clientY - startRef.current.py
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.current = true
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - SIZE, startRef.current.bx + dx)),
      y: Math.max(0, Math.min(window.innerHeight - SIZE, startRef.current.by + dy)),
    })
  }

  const onPointerUp = (_e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return
    dragging.current = false

    if (!moved.current) {
      // 没有移动 → 视为点击，切换下拉
      setOpen(v => !v)
      return
    }

    // 移动过 → 贴边吸附（开启过渡动画）
    setIsSnapping(true)
    const snapX = (pos.x + SIZE / 2) < window.innerWidth / 2
      ? EDGE_MARGIN
      : window.innerWidth - SIZE - EDGE_MARGIN
    setPos(p => ({ ...p, x: snapX }))
    setOpen(false)
  }

  // ── 点击外部关闭下拉 ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ── 选中场景 → 回首页 ────────────────────────────────────────────────────
  // 行为：回首页并记录目标场景，首页据此展示对应专员名称和快捷入口

  const switchTo = (agentId: string) => {
    setOpen(false)
    trackEvent('scenario_switched', {
      agentId,
      source: 'scenario_switcher',
    })
    dispatch({ type: 'RESET', homeAgentId: agentId })
  }

  // 始终显示：单场景时也可用于「快速重新开始」演示；多场景时切换业务

  // 下拉方向：按钮在右半侧时下拉靠右对齐
  const dropdownRight = (pos.x + SIZE / 2) > window.innerWidth / 2

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 9999,
        userSelect: 'none',
        transition: isSnapping
          ? 'left 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)'
          : 'none',
      }}
      onTransitionEnd={() => setIsSnapping(false)}
    >
      {/* ── 触发按钮 ── */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        title="切换演示场景"
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: '50%',
          background: open
            ? 'rgba(109, 40, 217, 0.85)'
            : 'rgba(109, 40, 217, 0.60)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(255,255,255,0.28)',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: open
            ? '0 4px 16px rgba(109,40,217,0.45)'
            : '0 2px 10px rgba(109,40,217,0.30)',
          touchAction: 'none',
          transition: 'background 0.15s, box-shadow 0.15s',
          padding: 0,
          outline: 'none',
          flexShrink: 0,
        }}
      >
        {/* 白色闪电图标 */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.5 1L3 8h4.5L5.5 13 11 6H6.5L8.5 1Z" fill="white" fillOpacity="0.95" />
        </svg>
      </button>

      {/* ── 下拉菜单 ── */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: SIZE + 8,
            ...(dropdownRight ? { right: 0 } : { left: 0 }),
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.11), 0 2px 6px rgba(0,0,0,0.06)',
            minWidth: 172,
            overflow: 'hidden',
            animation: 'scenarioSwitcherFadeIn 0.14s ease-out',
          }}
        >
          {/* 标题行 */}
          <div style={{
            padding: '7px 12px 5px',
            display: 'flex',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.07em',
              color: '#9ca3af',
              textTransform: 'uppercase',
            }}>
              切换专员
            </span>
          </div>

          {/* 专员列表 */}
          {visibleAgents.map((agent) => (
            <button
              key={agent.agentId}
              onClick={() => switchTo(agent.agentId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                borderTop: '1px solid rgba(0,0,0,0.05)',
                cursor: 'pointer',
                fontSize: 13,
                color: '#1f2937',
                textAlign: 'left',
                transition: 'background 0.1s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(109,40,217,0.07)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgba(109,40,217,0.45)',
                flexShrink: 0,
              }} />
              <span style={{ lineHeight: 1.4 }}>{agent.agentName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
