import { AppProvider, useApp, useAppDispatch } from './shared/store/AppContext'
import { WorkbenchPage, AuditWorkspaceView } from './pages/WorkbenchPage'
import { ScenarioSwitcher } from './components/ScenarioSwitcher'
import { TelemetryBridge } from './shared/TelemetryBridge'
import { SidebarShell } from './components/sidebar/SidebarShell'
import { useEffect } from 'react'

function AppShell() {
  const { state } = useApp()
  const dispatch = useAppDispatch()
  const isHome = state.phase === 'home'

  const handleBack = () => {
    dispatch({ type: 'RESET' })
  }

  if (state.shellMode === 'sidebar') {
    return <SidebarShell onNewChat={handleBack} />
  }

  return (
    <>
      {/* 首页背景图层 — 持久挂载，以保证渐隐过渡动画正常触发 */}
      <div className="app-home-bg" style={{ opacity: isHome ? 1 : 0 }} />
      {isHome ? <WorkbenchPage /> : <AuditWorkspaceView onBack={handleBack} />}
    </>
  )
}

function App() {
  return (
    <AppProvider>
      <TelemetryBridge />
      <ShellModeSync />
      <AppShell />
      <GlobalScenarioSwitcher />
    </AppProvider>
  )
}

function GlobalScenarioSwitcher() {
  const { state } = useApp()
  if (state.shellMode === 'sidebar') return null
  return <ScenarioSwitcher />
}

function ShellModeSync() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Demo-level switch. Default stays native/independent unless the URL opts in.
    // Example: ?shell=sidebar
    const shellMode = new URLSearchParams(window.location.search).get('shell')
    if (shellMode === 'sidebar') {
      dispatch({ type: 'SET_SHELL_MODE', shellMode: 'sidebar' })
    }
  }, [dispatch])

  return null
}

export default App
