import React, { createContext, useContext, useEffect, useReducer, type Dispatch } from 'react'
import type { AppState, AppAction } from './types'
import { appReducer, initialState } from './reducer'

interface AppContextValue {
  state: AppState
  dispatch: Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)
const APP_STATE_STORAGE_KEY = 'myy-aui-demo-shell:last-app-state'

function getRestoredInitialState(): AppState {
  if (typeof window === 'undefined') return initialState
  try {
    const rawState = window.sessionStorage.getItem(APP_STATE_STORAGE_KEY)
    if (!rawState) return initialState
    const parsedState = JSON.parse(rawState) as Partial<AppState>
    if (!parsedState || typeof parsedState !== 'object') return initialState
    return {
      ...initialState,
      ...parsedState,
      isStreaming: false,
      pendingQuestion: null,
      openPreview: false,
      openPreviewReadonly: false,
      openPreviewTargetPhase: null,
      openPreviewTargetArtifactTitle: null,
      openPreviewDelayMs: 0,
      openPreviewScrollBeforeOpen: false,
      closePreviewRequestId: 0,
      scenarioStates: parsedState.scenarioStates ?? {},
    }
  } catch {
    return initialState
  }
}

function getPersistableState(state: AppState): AppState {
  return {
    ...state,
    isStreaming: false,
    pendingQuestion: null,
    openPreview: false,
    openPreviewReadonly: false,
    openPreviewTargetPhase: null,
    openPreviewTargetArtifactTitle: null,
    openPreviewDelayMs: 0,
    openPreviewScrollBeforeOpen: false,
    closePreviewRequestId: 0,
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, getRestoredInitialState)

  useEffect(() => {
    if (state.isStreaming) return
    try {
      window.sessionStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(getPersistableState(state)))
    } catch {
      // sessionStorage can be unavailable in restricted preview contexts.
    }
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx.state
}

export function useAppDispatch() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider')
  return ctx.dispatch
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
