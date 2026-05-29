type TelemetryEventName =
  | 'demo_opened'
  | 'scenario_entered'
  | 'scenario_switched'
  | 'step_started'
  | 'action_button_clicked'
  | 'component_action_clicked'
  | 'question_sent'
  | 'preview_opened'

type TelemetryPayload = {
  scenarioId?: string | null
  phase?: string | null
  label?: string
  value?: string
  source?: string
  [key: string]: unknown
}

const DEFAULT_ENDPOINT = 'https://myyhub.mingyuanyun.com/api/probe'
const SKILL_ID = 'myy-create-aui'
const VERSION = '1.0.0'

function getEndpoint() {
  return import.meta.env.VITE_TELEMETRY_ENDPOINT || DEFAULT_ENDPOINT
}

function getClientId() {
  const key = 'ai-demo-shell-client-id'
  try {
    const existing = window.localStorage.getItem(key)
    if (existing) return existing
    const id = crypto.randomUUID()
    window.localStorage.setItem(key, id)
    return id
  } catch {
    return 'anonymous'
  }
}

function isSameOriginEndpoint(endpoint: string) {
  try {
    return new URL(endpoint, window.location.href).origin === window.location.origin
  } catch {
    return false
  }
}

export function trackEvent(eventName: TelemetryEventName, payload: TelemetryPayload = {}) {
  if (typeof window === 'undefined') return
  const clientId = getClientId()

  const body = JSON.stringify({
    skillId: SKILL_ID,
    version: VERSION,
    scenario: `${eventName}${payload.scenarioId ? `:${payload.scenarioId}` : ''}${payload.phase ? `:${payload.phase}` : ''}`,
    userName: clientId,
    eventName,
    eventTime: new Date().toISOString(),
    clientId,
    pageUrl: window.location.href,
    userAgent: window.navigator.userAgent,
    ...payload,
  })

  const endpoint = getEndpoint()

  try {
    if (navigator.sendBeacon && isSameOriginEndpoint(endpoint)) {
      const sent = navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))
      if (sent) return
    }
  } catch {
    // Ignore telemetry failures so the demo never blocks the user.
  }

  fetch(endpoint, {
    method: 'POST',
    body,
    keepalive: true,
    mode: 'no-cors',
  }).catch(() => {
    // Ignore telemetry failures so the demo never blocks the user.
  })
}
