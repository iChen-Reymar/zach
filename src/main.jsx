import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initDatabase } from './services/localDatabase'
import { isElectron } from './utils/isElectron'

async function setupServiceWorker() {
  if (isElectron()) return

  if (import.meta.env.DEV) {
    if (!('serviceWorker' in navigator)) return
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((r) => r.unregister()))
    return
  }

  const { registerSW } = await import('virtual:pwa-register')
  registerSW({ immediate: true })
}

function LoadingScreen() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="text-center text-white">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-medium">Loading Inventory.co...</p>
        <p className="text-sm text-blue-200 mt-1">Starting local database</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6">
      <div className="max-w-md text-center text-white bg-white/10 rounded-xl p-8 backdrop-blur">
        <h2 className="text-xl font-bold mb-2">Unable to start Inventory.co</h2>
        <p className="text-blue-100 text-sm mb-4">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

function BootstrapApp() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    setupServiceWorker()
      .then(() => initDatabase())
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch((err) => {
        console.error('Failed to initialize local database:', err)
        if (!cancelled) {
          setError(err?.message || 'Local database could not be initialized.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (error) return <ErrorScreen message={error} />
  if (!ready) return <LoadingScreen />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(<BootstrapApp />)
