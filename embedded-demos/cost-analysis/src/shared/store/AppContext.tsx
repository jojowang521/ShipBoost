import React, { createContext, useContext, useReducer, type Dispatch } from 'react'
import type { AppState, AppAction } from './types'
import { appReducer, initialState } from './reducer'

interface AppContextValue {
  state: AppState
  dispatch: Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
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
