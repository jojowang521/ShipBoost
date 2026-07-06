/**
 * 共用工具函数 -- 从 agentLoop.ts 中提取，不含 LLM 相关逻辑
 */

let messageIdCounter = 0

/** 生成唯一消息 ID */
export function genMessageId(): string {
  return `msg_${Date.now()}_${++messageIdCounter}`
}

export function summarizeTaskTitle(userInput: string): string {
  const normalized = userInput
    .replace(/\.(xlsx?|csv|pdf)$/i, '')
    .replace(/[“”"]/g, '')
    .replace(/^@\S+?[，,]\s*/u, '')
    .replace(/\s+/g, '')
    .replace(/^请?(帮我|帮忙|麻烦)?/, '')
    .replace(/^(我要|我想|做一次|做一个)/, '')
    .replace(/查下/g, '查')
    .replace(/查询/g, '查')
    .replace(/查看/g, '查')
    .replace(/控制价审查/g, '控制价审核')
    .replace(/，?并/g, '，并')
    .replace(/，+/g, '，')
    .replace(/^，|，$/g, '')

  const title = normalized || userInput.replace(/[，。！？、,.!?\s]+/g, '')
  return title || '新任务'
}

/** 从用户输入中提取简短标题（纯前端，不调 LLM） */
export function generateTaskTitle(userInput: string, dispatch: (action: any) => void) {
  dispatch({ type: 'SET_CURRENT_TASK_TITLE', title: summarizeTaskTitle(userInput) })
}

/** 流式模拟打字效果 */
export function streamFakeText(text: string, messageId: string, dispatch: (action: any) => void, onComplete?: () => void) {
  let i = 0
  dispatch({ type: 'SET_STREAMING', isStreaming: true })
  const timer = setInterval(() => {
    if (i < text.length) {
      dispatch({ type: 'APPEND_STREAMING_TEXT', messageId, text: text[i] })
      i++
    } else {
      clearInterval(timer)
      dispatch({ type: 'SET_STREAMING', isStreaming: false })
      if (onComplete) onComplete()
    }
  }, 14)
}
