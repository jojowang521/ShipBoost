/**
 * AuditWorkspaceShell — 统一宿主外壳（首页 + 工作台共用）
 *
 * P9-g.5 对齐更新：
 * - 左侧侧栏收起时宽度→0，浮层胶囊（audit-header-capsule）绝对定位于主内容区左上角
 * - chat-panel-header 改为 AuditHeader 风格：
 *     收起态：左侧胶囊（展开按钮 + 新建）+ 右侧"内容由 AI 生成"提示
 *     展开态：只有右侧提示（侧栏已展开，无需重复入口）
 * - 删除旧 topbar 中遗留的任务标题行（工作台 topbar 已极简）
 *
 * P9-g.4 宿主统一：
 * - 首页和工作台共用此组件
 * - homeContent prop：首页插槽，传入时渲染首页内容替换 ChatPanel
 *
 * 对齐参考：AI 采招风控_独立模式
 *   - AuditLayout.tsx（三栏布局）
 *   - HistorySidebar.tsx（width→0 裁切动画）
 *   - AuditHeader.tsx（收起态胶囊 + 右侧提示，内嵌在对话区顶部）
 */
import React, { useState, useCallback } from 'react'
import { AuditHistoryRail } from './AuditHistoryRail'
import { PreviewDock } from './PreviewDock'
import { AppLogo } from './AppLogo'
import { FoldIcon } from './FoldIcon'
import { NewChatIcon } from './NewChatIcon'
import ChatPanel from '../shared/chat/ChatPanel'
import { FileText } from 'lucide-react'
import { useAppState, useAppDispatch } from '../shared/store/AppContext'

interface ArtifactItem {
  title: string
  targetPhase: string
}

interface Props {
  panelContent?: React.ReactNode
  hasPanelContent?: boolean
  panelTitle?: string
  panelFooter?: React.ReactNode
  onBack?: () => void
  homeContent?: React.ReactNode
  artifacts?: ArtifactItem[]
  onSelectArtifact?: (targetPhase: string) => void
}

export function AuditWorkspaceShell({
  panelContent,
  hasPanelContent = false,
  panelTitle,
  panelFooter,
  onBack,
  homeContent,
  artifacts = [],
  onSelectArtifact,
}: Props) {
  const isHome = !!homeContent

  const appState = useAppState()
  const appDispatch = useAppDispatch()
  const [railCollapsed, setRailCollapsed] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  // 记录当前预览是否以只读模式打开（通过已操作的卡片打开）
  const [previewReadonly, setPreviewReadonly] = useState(false)

  React.useEffect(() => {
    if (isHome) setPreviewOpen(false)
  }, [isHome])


  // 响应来自对话区 PreviewTriggerCard 的 openPreview dispatch
  React.useEffect(() => {
    if (!appState.openPreview) return
    // 先通过 targetPhase 切换面板内容（onSelectArtifact），再打开面板
    if (appState.openPreviewTargetPhase) {
      onSelectArtifact?.(appState.openPreviewTargetPhase)
    }
    setPreviewOpen(true)
    setPreviewReadonly(!!appState.openPreviewReadonly)
    appDispatch({ type: 'RESET_OPEN_PREVIEW' })
  }, [appState.openPreview, appState.openPreviewTargetPhase, appState.openPreviewReadonly, onSelectArtifact, appDispatch])

  const handleToggleRail = useCallback(() => setRailCollapsed((v) => !v), [])
  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false)
    setPreviewReadonly(false)
  }, [])
  const handleTogglePreview = useCallback(() => {
    if (!hasPanelContent) return
    setPreviewOpen((v) => !v)
  }, [hasPanelContent])

  React.useEffect(() => {
    if (!hasPanelContent) {
      setPreviewOpen(false)
      setPreviewReadonly(false)
    }
  }, [hasPanelContent])

  const chatFlex = !isHome && previewOpen
    ? (railCollapsed ? '0 0 400px' : '3 1 0')
    : '1 1 auto'
  const previewFlex = railCollapsed ? '1 1 0' : '7 1 0'

  return (
    <div className={`audit-workspace${isHome ? ' audit-workspace--home' : ''}`}>

      {/* 主体区 */}
      <div className="audit-workspace__body">

        {/* 左侧历史侧栏 — 收起时 width→0，胶囊由主内容区头部承载 */}
        <AuditHistoryRail
          isCollapsed={railCollapsed}
          onToggle={handleToggleRail}
          onNewChat={onBack}
        />

        {/* 中间主内容区 */}
        <div
          className="audit-workspace__chat"
          style={{
            flex: chatFlex,
            transition: 'flex 280ms ease-out',
          }}
        >
          {/* 极简顶部提示条（收起态左侧放胶囊，展开态只有右侧提示） */}
          <div className="audit-chat-header">
            {/* 左侧：收起态胶囊（内联在 header flex 流中，避免绝对定位重叠） */}
            <div
              className="audit-collapsed-capsule-wrap"
              style={{
                opacity: railCollapsed ? 1 : 0,
                pointerEvents: railCollapsed ? 'auto' : 'none',
                transform: railCollapsed ? 'translateX(0)' : 'translateX(-8px)',
                position: 'static',
                flexShrink: 0,
              }}
            >
              {/* 胶囊：展开按钮 + 新建对话按钮 */}
              <div className="audit-collapsed-capsule">
                <button
                  onClick={handleToggleRail}
                  className="audit-collapsed-capsule__btn"
                  aria-label="展开侧栏"
                  title="展开侧栏"
                >
                  <FoldIcon />
                </button>
                <button
                  onClick={onBack}
                  className="audit-collapsed-capsule__btn"
                  aria-label="新建对话"
                  title="新建对话"
                >
                  <NewChatIcon />
                </button>
              </div>
              {/* 胶囊右侧独立 Logo */}
              <div className="audit-collapsed-logo">
                <AppLogo />
              </div>
            </div>

            {/* 占位 flex spacer */}
            <div style={{ flex: 1 }} />

            {/* 右侧：AI 提示 + 分割线 + 文档图标 */}
            <div className="audit-chat-header__right">
              <span className="audit-chat-header__ai-hint">内容由AI 生成</span>

              {/* 仅工作台模式显示分割线和图标 */}
              {!isHome && (
                <>
                  <div className="audit-chat-header__divider" />

                  <div className="artifact-dropdown-wrap">
                    <button
                      className={`artifact-doc-btn${dropdownOpen ? ' is-active' : ''}`}
                      disabled={artifacts.length === 0}
                      title={artifacts.length === 0 ? '当前对话暂无内容' : '查看本次生成内容'}
                      onClick={() => setDropdownOpen((v) => !v)}
                    >
                      <FileText size={16} />
                    </button>

                    {dropdownOpen && artifacts.length > 0 && (
                      <>
                        <div
                          className="artifact-dropdown-mask"
                          onClick={() => setDropdownOpen(false)}
                        />
                        <div className="artifact-dropdown">
                          {artifacts.map((item) => (
                            <button
                              key={item.targetPhase}
                              className="artifact-dropdown-item"
                              onClick={() => {
                                onSelectArtifact?.(item.targetPhase)
                                setPreviewOpen(true)
                                setDropdownOpen(false)
                              }}
                            >
                              <FileText size={14} />
                              <span>{item.title}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 主内容区 */}
          {isHome ? (
            homeContent
          ) : (
            <ChatPanel
              mode="sidebar"
              previewOpen={previewOpen && hasPanelContent}
              hasPreviewContent={hasPanelContent}
              onTogglePreview={handleTogglePreview}
            />
          )}
        </div>

        {/* 右侧预览区（工作台模式） */}
        {!isHome && (
          <PreviewDock
            isVisible={previewOpen && hasPanelContent}
            onClose={handleClosePreview}
            title={panelTitle}
            footer={panelFooter}
            footerReadonly={previewReadonly}
            flex={previewFlex}
          >
            {panelContent}
          </PreviewDock>
        )}
      </div>
    </div>
  )
}
