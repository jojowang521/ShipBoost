const PLAY_INTERVAL_MS = 600

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function formatMessage(value) {
  return escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .split(/\n{2,}/)
    .map(part => `<p>${part.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function closePage() {
  window.close()
  if (!window.closed) window.location.href = '/'
}

function createUserBubble(content) {
  const wrap = document.createElement('div')
  wrap.className = 'replay-item replay-user'
  wrap.innerHTML = `<div class="replay-user__bubble">${escapeHtml(content)}</div>`
  return wrap
}

function createAssistantBubble(content, scene) {
  const agentName = scene?.agentName || 'AI 专员'
  const avatarSrc = scene?.avatarSrc || '/avatar-ai-1.png'
  const wrap = document.createElement('div')
  wrap.className = 'replay-item replay-assistant'
  wrap.innerHTML = `
    <div class="replay-assistant__header">
      <div class="replay-avatar"><img src="${avatarSrc}" alt="${escapeHtml(agentName)}" /></div>
      <div class="replay-agent-name">${escapeHtml(agentName)}</div>
    </div>
    <div class="replay-assistant__content">${formatMessage(content)}</div>
  `
  return wrap
}

function stepMeta(type) {
  if (type === 'thinking') return { label: 'AI 思考中...', icon: '✦', className: 'agent-step--thinking' }
  if (type === 'tool_call') return { label: '工具调用', icon: '⌘', className: 'agent-step--tool_call' }
  return { label: '工具结果', icon: '✓', className: 'agent-step--tool_result' }
}

function createAgentStep(step) {
  const meta = stepMeta(step.type)
  const wrap = document.createElement('div')
  wrap.className = `replay-item agent-step ${meta.className}`

  if (step.type === 'thinking') {
    wrap.innerHTML = `
      <button class="agent-step__summary" type="button">
        <span class="agent-step__label"><span>${meta.icon}</span>${meta.label}</span>
        <span class="agent-step__chevron">⌄</span>
      </button>
      <div class="agent-step__detail" hidden>${escapeHtml(step.content)}</div>
    `
    const button = wrap.querySelector('.agent-step__summary')
    const detail = wrap.querySelector('.agent-step__detail')
    button.addEventListener('click', () => {
      const nextOpen = !wrap.classList.contains('is-open')
      wrap.classList.toggle('is-open', nextOpen)
      detail.hidden = !nextOpen
    })
    return wrap
  }

  wrap.innerHTML = `
    <div class="agent-step__body">
      <div class="agent-step__eyebrow">${meta.label}</div>
      <div class="agent-step__detail">${escapeHtml(step.content)}</div>
    </div>
  `
  return wrap
}

function createThinkingPlaceholder(scene) {
  const agentName = scene?.agentName || 'AI 专员'
  const avatarSrc = scene?.avatarSrc || '/avatar-ai-1.png'
  const wrap = document.createElement('div')
  wrap.className = 'replay-item agent-thinking-placeholder'
  wrap.innerHTML = `
    <div class="avatar agent-thinking-placeholder__avatar">
      <img src="${avatarSrc}" alt="${escapeHtml(agentName)}" />
    </div>
    <div class="thinking-dots" aria-label="${escapeHtml(agentName)}执行中">
      <span></span><span></span><span></span>
    </div>
  `
  return wrap
}

function compactStepContent(content, maxLength = 20) {
  const text = String(content || '').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

function subtitleForStep(step) {
  if (step.type === 'thinking') return 'AI 思考中...'
  if (step.type === 'tool_call') return `正在执行：${compactStepContent(step.content)}`
  if (step.type === 'tool_result') return `已获取：${compactStepContent(step.content)}`
  return ''
}

function createArtifactCard(scene) {
  const artifact = scene?.artifact
  const wrap = document.createElement('div')
  wrap.className = 'replay-item generated-artifact'

  if (!artifact) return wrap

  wrap.innerHTML = `
    <button class="generated-artifact-card" type="button" aria-label="查看生成物详情：${escapeHtml(artifact.title)}">
      <span class="generated-artifact-card__icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="8" fill="#E9ECFF"></rect>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M27.75 13.4033C27.75 11.9638 26.4171 10.8946 25.0119 11.2068L13.3869 13.7902C12.3574 14.0189 11.625 14.932 11.625 15.9866V34.1258C11.625 35.3685 12.6324 36.3758 13.875 36.3758H26.625C27.2463 36.3758 27.75 35.8721 27.75 35.2508V13.4033ZM16.1248 21.7508C16.1248 21.1294 16.6285 20.6258 17.2498 20.6258H22.1248C22.7461 20.6258 23.2498 21.1294 23.2498 21.7508C23.2498 22.3721 22.7461 22.8758 22.1248 22.8758H17.2498C16.6285 22.8758 16.1248 22.3721 16.1248 21.7508ZM17.2498 25.5008C16.6285 25.5008 16.1248 26.0045 16.1248 26.6258C16.1248 27.2471 16.6285 27.7508 17.2498 27.7508H19.4998C20.1211 27.7508 20.6248 27.2471 20.6248 26.6258C20.6248 26.0045 20.1211 25.5008 19.4998 25.5008H17.2498Z" fill="#645BFF"></path>
          <path d="M29.625 36.375H34.1246C35.3673 36.375 36.3746 35.3676 36.3746 34.125V20.625C36.3746 19.3824 35.3673 18.375 34.1246 18.375H29.625V36.375Z" fill="#645BFF"></path>
        </svg>
      </span>
      <span class="generated-artifact-card__body">
        <span class="generated-artifact-card__title">${escapeHtml(artifact.title)}</span>
        <span class="generated-artifact-card__desc">${escapeHtml(artifact.description || artifact.fileName || '查看生成物详情')}</span>
      </span>
      <span class="generated-artifact-card__action">详情</span>
    </button>
  `

  wrap.querySelector('button')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('replay:open-workbench', { detail: { artifact } }))
  })

  return wrap
}

function roundElementFactories(round, roundIndex, scene, includeAgentSteps) {
  const elements = []
  if (round.user_message) {
    elements.push({ roundIndex, kind: 'user', create: () => createUserBubble(round.user_message) })
  }
  if (includeAgentSteps) {
    for (const step of round.agent_steps) {
      elements.push({ roundIndex, kind: 'agent_step', step, create: () => createAgentStep(step) })
    }
  }
  elements.push({ roundIndex, kind: 'assistant', create: () => createAssistantBubble(round.assistant_message, scene) })
  return elements
}

export function createAutomationBanner(text) {
  const banner = document.createElement('div')
  banner.className = 'replay-item automation-banner'
  banner.innerHTML = `
    <span class="automation-banner__dot"></span>
    <span>${escapeHtml(text)}</span>
  `
  return banner
}

export function createTimelinePlayer({
  rounds,
  timeline,
  scene,
  includeArtifact = true,
  includeAgentSteps = true,
  showRoundPlaceholder = false,
  onRoundChange,
  onComplete,
  onProgress,
  onSubtitle,
}) {
  const items = rounds.flatMap((round, index) => roundElementFactories(round, index, scene, includeAgentSteps))
  if (includeArtifact && scene?.artifact && rounds.length > 0) {
    items.push({ roundIndex: rounds.length - 1, kind: 'artifact', create: () => createArtifactCard(scene) })
  }
  let pointer = 0
  let timerId = 0
  let isPaused = false
  let isComplete = false
  let activePlaceholder = null
  let activePlaceholderRoundIndex = -1
  let subtitle = ''

  function scrollToLatest() {
    requestAnimationFrame(() => {
      const latest = timeline.lastElementChild
      if (!latest) return

      const controlsHeight = document.querySelector('#replayControls')?.getBoundingClientRect().height || 0
      const latestRect = latest.getBoundingClientRect()
      const visibleBottom = window.innerHeight - controlsHeight - 24
      const delta = latestRect.bottom - visibleBottom
      if (delta <= 0) return

      const scrollContainer = document.body.classList.contains('replay-workbench-open')
        ? timeline.closest('.replay-content')
        : document.scrollingElement

      if (scrollContainer && scrollContainer !== document.scrollingElement) {
        scrollContainer.scrollBy({ top: delta, behavior: 'smooth' })
      } else {
        window.scrollBy({ top: delta, behavior: 'smooth' })
      }
    })
  }

  function appendElement(element) {
    timeline.appendChild(element)
    scrollToLatest()
  }

  function setSubtitle(text) {
    subtitle = text || ''
    onSubtitle?.(subtitle)
  }

  function isRoundStart() {
    if (pointer >= items.length) return false
    return pointer === 0 || items[pointer - 1]?.roundIndex !== items[pointer]?.roundIndex
  }

  function removeRoundPlaceholder(roundIndex = activePlaceholderRoundIndex, instant = false) {
    if (!activePlaceholder) return
    if (roundIndex !== activePlaceholderRoundIndex) return

    const placeholder = activePlaceholder
    activePlaceholder = null
    activePlaceholderRoundIndex = -1

    if (instant) {
      placeholder.remove()
      return
    }

    placeholder.classList.add('is-leaving')
    window.setTimeout(() => placeholder.remove(), 180)
  }

  function insertRoundPlaceholder() {
    if (!showRoundPlaceholder || !isRoundStart()) return
    const roundIndex = items[pointer]?.roundIndex
    if (activePlaceholder && activePlaceholderRoundIndex === roundIndex) return

    removeRoundPlaceholder(activePlaceholderRoundIndex, true)
    activePlaceholder = createThinkingPlaceholder(scene)
    activePlaceholderRoundIndex = roundIndex
    timeline.appendChild(activePlaceholder)
    setSubtitle(`第 ${roundIndex + 1} 轮开始执行...`)
    scrollToLatest()
  }

  function appendItem(item) {
    removeRoundPlaceholder(item.roundIndex)
    if (item.kind === 'agent_step') setSubtitle(subtitleForStep(item.step))
    appendElement(item.create())
  }

  function currentRoundIndex() {
    if (items.length === 0) return 0
    if (pointer >= items.length) return rounds.length - 1
    return items[Math.max(0, pointer)]?.roundIndex ?? 0
  }

  function progressPayload() {
    return {
      currentRoundIndex: currentRoundIndex(),
      totalRounds: rounds.length,
      currentItem: pointer,
      totalItems: items.length,
      progress: items.length === 0 ? 100 : Math.round((pointer / items.length) * 100),
      subtitle,
      isPaused,
      isComplete,
    }
  }

  function emitProgress() {
    const payload = progressPayload()
    onRoundChange?.(payload.currentRoundIndex, payload.totalRounds)
    onProgress?.(payload)
    if (pointer > 0) scrollToLatest()
  }

  function stopTimer() {
    if (timerId) window.clearTimeout(timerId)
    timerId = 0
  }

  function finishIfNeeded() {
    if (pointer < items.length || isComplete) return false
    isComplete = true
    isPaused = true
    stopTimer()
    removeRoundPlaceholder(activePlaceholderRoundIndex)
    setSubtitle('')
    emitProgress()
    onComplete?.()
    return true
  }

  function scheduleNext() {
    stopTimer()
    if (isPaused || isComplete) {
      emitProgress()
      return
    }
    insertRoundPlaceholder()
    timerId = window.setTimeout(() => {
      if (isPaused || isComplete) return
      if (pointer < items.length) {
        appendItem(items[pointer])
        pointer += 1
        emitProgress()
      }
      if (!finishIfNeeded()) scheduleNext()
    }, PLAY_INTERVAL_MS)
  }

  function renderTo(nextPointer) {
    stopTimer()
    removeRoundPlaceholder(activePlaceholderRoundIndex, true)
    const clamped = Math.max(0, Math.min(items.length, nextPointer))
    timeline.innerHTML = ''
    for (let index = 0; index < clamped; index += 1) {
      timeline.appendChild(items[index].create())
    }
    pointer = clamped
    isComplete = pointer >= items.length
    emitProgress()
    if (isComplete) {
      onComplete?.()
    }
  }

  function start() {
    stopTimer()
    removeRoundPlaceholder(activePlaceholderRoundIndex, true)
    timeline.innerHTML = ''
    pointer = 0
    isPaused = false
    isComplete = false
    setSubtitle('')
    emitProgress()
    scheduleNext()
  }

  function skipRound() {
    if (isComplete) return
    const roundIndex = currentRoundIndex()
    removeRoundPlaceholder(roundIndex)
    while (pointer < items.length && items[pointer].roundIndex === roundIndex) {
      appendItem(items[pointer])
      pointer += 1
    }
    emitProgress()
    if (!finishIfNeeded()) scheduleNext()
  }

  function previousRound() {
    const targetRound = Math.max(0, currentRoundIndex() - 1)
    const targetPointer = items.findIndex(item => item.roundIndex === targetRound)
    isPaused = false
    isComplete = false
    renderTo(targetPointer < 0 ? 0 : targetPointer)
    scheduleNext()
  }

  function nextRound() {
    skipRound()
  }

  function pause() {
    if (isComplete) return
    isPaused = true
    stopTimer()
    emitProgress()
  }

  function resume() {
    if (isComplete) {
      start()
      return
    }
    isPaused = false
    emitProgress()
    scheduleNext()
  }

  function togglePlay() {
    if (isPaused) resume()
    else pause()
  }

  function jumpToProgress(progress) {
    const nextPointer = Math.round(items.length * (Number(progress) / 100))
    isPaused = true
    isComplete = false
    renderTo(nextPointer)
  }

  return { start, skipRound, previousRound, nextRound, pause, resume, togglePlay, jumpToProgress }
}
