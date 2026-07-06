import { getReplayScene, getSceneIdFromLocation } from './replay-data.js'
import { closePage, createTimelinePlayer, escapeHtml } from './replay-runtime.js'

const sceneId = getSceneIdFromLocation()
const scene = getReplayScene(sceneId)

const title = document.querySelector('#replayTitle')
const timeline = document.querySelector('#replayTimeline')
const controls = document.querySelector('#replayControls')
const workbench = document.querySelector('#replayWorkbench')
const workbenchTitle = document.querySelector('#workbenchTitle')
const workbenchBody = document.querySelector('#workbenchBody')
const closeWorkbenchButton = document.querySelector('#closeWorkbench')
const workbenchBackdrop = document.querySelector('#workbenchBackdrop')

const WORKBENCH_TRANSITION_MS = 250

let player
let workbenchTransitionTimer
let currentSubtitle = ''

function iconSvg(iconName) {
  const icons = {
    'skip-back': '<path d="M6 5v14"></path><path d="m19 6-9 6 9 6V6Z"></path>',
    'skip-forward': '<path d="M18 5v14"></path><path d="m5 6 9 6-9 6V6Z"></path>',
    play: '<path d="m8 5 11 7-11 7V5Z"></path>',
    pause: '<path d="M8 5v14"></path><path d="M16 5v14"></path>',
    replay: '<path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 4v6h6"></path>',
  }

  return `
    <svg class="replay-player__svg" viewBox="0 0 24 24" aria-hidden="true">
      ${icons[iconName] || icons.play}
    </svg>
  `
}

function iconButton(id, label, iconName) {
  return `<button id="${id}" class="replay-player__icon" type="button" aria-label="${label}" title="${label}">${iconSvg(iconName)}</button>`
}

function playIcon(isPaused, isComplete) {
  if (isComplete) return 'replay'
  return isPaused ? 'play' : 'pause'
}

function updateSubtitle(text = '') {
  currentSubtitle = text
  const subtitle = controls.querySelector('.replay-player__secondary')
  if (subtitle) subtitle.textContent = currentSubtitle
}

function renderRoundStepper(state) {
  const totalRounds = Math.max(1, state.totalRounds || scene.rounds.length)
  const currentRound = Math.max(0, Math.min(totalRounds - 1, state.currentRoundIndex || 0))

  const steps = Array.from({ length: totalRounds }, (_, index) => {
    const status = state.isComplete || index < currentRound
      ? 'is-complete'
      : index === currentRound
        ? 'is-current'
        : 'is-pending'
    const line = state.isComplete || index < currentRound ? 'has-complete-line' : ''

    return `
      <span class="replay-stepper__item ${status} ${line}" aria-label="第 ${index + 1} 轮">
        <span class="replay-stepper__dot"></span>
        <span class="replay-stepper__label">${index + 1}</span>
      </span>
    `
  }).join('')

  return `<div class="replay-stepper" aria-label="轮次步骤指示器">${steps}</div>`
}

function renderArtifactStrip() {
  const artifact = scene.artifact
  if (!artifact) return ''

  return `
    <button id="openArtifactStrip" class="replay-artifact-strip" type="button">
      <span class="replay-artifact-strip__thumb">
        <span class="replay-artifact-strip__doc">
          <span>${escapeHtml(artifact.thumbnailTitle || artifact.typeLabel || '生成物')}</span>
          <small>${escapeHtml(artifact.thumbnailMeta || artifact.status || '已生成')}</small>
        </span>
      </span>
      <span class="replay-artifact-strip__main">
        <span class="replay-artifact-strip__title">${escapeHtml(artifact.fileName || artifact.title)}</span>
        <span class="replay-artifact-strip__desc">${escapeHtml(artifact.description || '点击查看右侧工作台')}</span>
      </span>
      <span class="replay-artifact-strip__count">1 / 1</span>
      <span class="replay-artifact-strip__chevron">⌃</span>
    </button>
  `
}

function renderPlayerControls(state) {
  const subtitle = state.isComplete ? '' : (state.subtitle || currentSubtitle || '')
  controls.innerHTML = `
    <div class="replay-bottom-shell">
      <div class="replay-player ${state.isComplete ? 'replay-player--complete' : 'replay-player--playing'}" aria-label="任务回放播放控制">
        <div class="replay-player__status">
          <span class="replay-player__logo">AI</span>
          <span class="replay-player__copy">
            <span class="replay-player__primary">${state.isComplete ? '任务回放完成。' : `第 ${state.currentRoundIndex + 1} 轮 / 共 ${state.totalRounds} 轮`}</span>
            ${state.isComplete ? '' : `<span class="replay-player__secondary">${escapeHtml(subtitle)}</span>`}
          </span>
        </div>
        ${state.isComplete
          ? `<div class="replay-player__complete-actions">
              <button id="togglePlay" class="replay-player__button replay-player__button--secondary" type="button">重看</button>
              <a id="startSimilarTask" class="replay-player__button replay-player__button--primary" href="./automation.html?scene=${encodeURIComponent(sceneId)}" target="_blank" rel="noreferrer">做类似任务</a>
            </div>`
          : `<div class="replay-player__bar">
              ${iconButton('prevRound', '上一轮', 'skip-back')}
              ${iconButton('togglePlay', state.isComplete ? '重新观看' : state.isPaused ? '继续播放' : '暂停播放', playIcon(state.isPaused, state.isComplete))}
              ${iconButton('nextRound', '下一轮', 'skip-forward')}
              ${renderRoundStepper(state)}
            </div>
            <button id="skipRound" class="replay-player__button replay-player__button--secondary" type="button">跳过本轮</button>`}
      </div>
    </div>
  `

  controls.querySelector('#prevRound')?.addEventListener('click', () => player.previousRound())
  controls.querySelector('#togglePlay')?.addEventListener('click', () => {
    if (state.isComplete) {
      closeWorkbench()
      player.start()
      return
    }
    player.togglePlay()
  })
  controls.querySelector('#nextRound')?.addEventListener('click', () => player.nextRound())
  controls.querySelector('#skipRound')?.addEventListener('click', () => player.skipRound())
}

function renderMetric(metric) {
  return `
    <div class="workbench-metric">
      <span class="workbench-metric__label">${escapeHtml(metric.label)}</span>
      <strong class="workbench-metric__value">${escapeHtml(metric.value)}</strong>
    </div>
  `
}

function renderSection(section, index) {
  const columns = section.columns || []
  const rows = section.rows || []
  const sectionNumber = String(index + 1).padStart(2, '0')

  return `
    <section class="workbench-section">
      <header class="workbench-section__head">
        <span class="workbench-section__num">${sectionNumber}</span>
        <h3>${escapeHtml(section.heading)}</h3>
      </header>
      <div class="workbench-section__body">
        <div class="workbench-table-scroll">
          <table class="workbench-table">
            <thead>
              <tr>${columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `
}

function renderWorkbench() {
  const artifact = scene.artifact
  if (!artifact) return
  const fileMark = artifact.typeLabel?.includes('Excel') ? 'XLS' : artifact.typeLabel?.includes('PDF') ? 'PDF' : 'DOC'

  workbenchTitle.textContent = artifact.title
  workbenchBody.innerHTML = `
    <article class="workbench-report">
      <header class="workbench-report__hero">
        <div>
          <h2>${escapeHtml(artifact.title)}</h2>
          <p class="workbench-report__summary">${escapeHtml(artifact.description || '')}</p>
          <div class="workbench-report__ai-attr">
            <span class="workbench-report__ai-name">${escapeHtml(scene.agentName || 'AI 专员')}</span>
            <span class="workbench-report__ai-sub">已按任务回放生成当前工作台内容</span>
          </div>
        </div>
        <span class="workbench-report__status">${escapeHtml(artifact.status || '已生成')}</span>
      </header>

      <div class="workbench-file">
        <span class="workbench-file__icon">${fileMark}</span>
        <span>
          <strong>${escapeHtml(artifact.fileName || artifact.title)}</strong>
          <small>生成时间：${escapeHtml(artifact.generatedAt || '任务完成后自动生成')}</small>
        </span>
      </div>

      <section class="workbench-metrics" aria-label="关键指标">
        ${(artifact.metrics || []).map(renderMetric).join('')}
      </section>

      ${(artifact.sections || []).map((section, index) => renderSection(section, index)).join('')}
    </article>
  `
}

function openWorkbench() {
  if (!scene.artifact) return
  window.clearTimeout(workbenchTransitionTimer)
  renderWorkbench()
  workbench.hidden = false
  if (workbenchBackdrop) workbenchBackdrop.hidden = true
  document.body.classList.remove('replay-workbench-closing')
  window.requestAnimationFrame(() => {
    document.body.classList.add('replay-workbench-open')
  })
}

function closeWorkbench() {
  if (workbench.hidden) return
  window.clearTimeout(workbenchTransitionTimer)
  if (workbenchBackdrop) workbenchBackdrop.hidden = true
  document.body.classList.add('replay-workbench-closing')
  workbenchTransitionTimer = window.setTimeout(() => {
    workbench.hidden = true
    document.body.classList.remove('replay-workbench-open', 'replay-workbench-closing')
  }, WORKBENCH_TRANSITION_MS)
}

title.textContent = scene.title
document.title = `任务回放 - ${scene.title}`
closeWorkbenchButton?.addEventListener('click', closeWorkbench)
workbenchBackdrop?.addEventListener('click', closeWorkbench)
window.addEventListener('replay:open-workbench', openWorkbench)

player = createTimelinePlayer({
  rounds: scene.rounds,
  scene,
  timeline,
  includeAgentSteps: false,
  showRoundPlaceholder: true,
  onProgress: renderPlayerControls,
  onSubtitle: updateSubtitle,
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closePage()
  if (event.code === 'Space') {
    event.preventDefault()
    player.skipRound()
  }
})

player.start()
