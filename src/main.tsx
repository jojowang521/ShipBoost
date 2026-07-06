import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './shared/store/AppContext'
import { WorkbenchPage } from './pages/WorkbenchPage'

function Root() {
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')

  if (view === 'noma') {
    return (
    <AppProvider>
      <WorkbenchPage />
    </AppProvider>
    )
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
