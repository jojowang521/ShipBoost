import { getReplayScene, getSceneIdFromLocation } from './replay-data.js'
import { closePage, createAutomationBanner, createTimelinePlayer } from './replay-runtime.js'

const sceneId = getSceneIdFromLocation()
const scene = getReplayScene(sceneId)

const title = document.querySelector('#automationTitle')
const timeline = document.querySelector('#automationTimeline')
const controls = document.querySelector('#automationControls')
const closeButton = document.querySelector('#closeAutomation')
const restartButton = document.querySelector('#restartAutomation')
const status = document.querySelector('#automationStatus')

let player

function renderRoundStatus(state) {
  status.textContent = state.currentRoundIndex === 0
    ? '正在自动提交任务'
    : `自动执行中：第 ${state.currentRoundIndex + 1} 轮 / 共 ${state.totalRounds} 轮`
}

function renderCompleteStatus() {
  status.textContent = '自动化任务已完成'
}

function startAutomation() {
  player.start()
  const submittedPrompt = scene.automationSteps?.[0]?.user_message || scene.defaultPrompt
  timeline.prepend(createAutomationBanner(`已默认提交提示词：${submittedPrompt}`))
}

title.textContent = scene.title
document.title = `自动化任务 - ${scene.title}`
closeButton.addEventListener('click', closePage)
restartButton.addEventListener('click', startAutomation)
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closePage()
})

player = createTimelinePlayer({
  rounds: scene.automationSteps,
  scene,
  timeline,
  includeArtifact: false,
  onProgress: renderRoundStatus,
  onComplete: renderCompleteStatus,
})

controls.hidden = false
startAutomation()
