import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './shared/store/AppContext'
import { WorkbenchPage } from './pages/WorkbenchPage'
import { SideNavGlobalNav } from './modes/side-nav-embed/SideNavGlobalNav'

function NomaSideNavRoot() {
  const [homeResetSignal, setHomeResetSignal] = useState(0)

  const handleAssistantClick = () => {
    const params = new URLSearchParams(window.location.search)
    params.set('view', 'noma')
    params.delete('agent')
    params.delete('assistant')
    params.delete('preview')
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
    setHomeResetSignal(signal => signal + 1)
  }

  return (
    <AppProvider>
      <div className="native-global-shell native-global-shell--side-nav-embed">
        <SideNavGlobalNav activeItem="assistant" onAssistantClick={handleAssistantClick} />
        <main className="native-global-shell__content">
          <WorkbenchPage embedMode="side-nav" navigationMode="side-nav" homeResetSignal={homeResetSignal} />
        </main>
      </div>
    </AppProvider>
  )
}

function Root() {
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')

  if (view === 'noma') {
    return <NomaSideNavRoot />
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
