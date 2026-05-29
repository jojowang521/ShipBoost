import { useEffect, useRef } from 'react'
import { useAppState } from './store/AppContext'
import { trackEvent } from './telemetry'

export function TelemetryBridge() {
  const state = useAppState()
  const lastStepKey = useRef('')

  useEffect(() => {
    trackEvent('demo_opened')
  }, [])

  useEffect(() => {
    if (!state.currentScenario || state.phase === 'home') return

    const key = `${state.currentScenario}:${state.phase}`
    if (key === lastStepKey.current) return
    lastStepKey.current = key

    trackEvent('step_started', {
      scenarioId: state.currentScenario,
      phase: state.phase,
    })
  }, [state.currentScenario, state.phase])

  return null
}
