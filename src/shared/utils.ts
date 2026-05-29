/**
 * 共用工具函数 -- 从 agentLoop.ts 中提取，不含 LLM 相关逻辑
 */

let messageIdCounter = 0

/** 生成唯一消息 ID */
export function genMessageId(): string {
  return `msg_${Date.now()}_${++messageIdCounter}`
}

/** 从用户输入中提取简短标题（纯前端，不调 LLM） */
export function generateTaskTitle(userInput: string, dispatch: (action: any) => void) {
  const cleaned = userInput
    .replace(/\.(xlsx?|csv|pdf)$/i, '')
    .replace(/[。，！.!?\s]+/g, '')
  const title = cleaned.slice(0, 10) || '新任务'
  dispatch({ type: 'SET_CURRENT_TASK_TITLE', title })
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
  }, 30)
}
