import { useState } from 'react'
import { usePWAInstall } from '../hooks/usePWAInstall'

function InstallApp({ variant = 'banner', onDismiss }) {
  const { canInstall, isInstalled, isIOSDevice, isDev, install } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)

  const handleInstall = async () => {
    setInstalling(true)
    try {
      await install()
    } finally {
      setInstalling(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">App Installed</p>
              <p className="text-sm text-gray-600">Inventory.co is installed on this device.</p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (variant === 'banner' && (dismissed || (!canInstall && !isIOSDevice))) {
    return null
  }

  if (variant === 'card' && !canInstall && !isIOSDevice) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6">
        <p className="font-semibold text-gray-900 mb-1">Install App</p>
        <p className="text-sm text-gray-600">
          {isDev
            ? 'Run "npm run build" then "npm run preview" to test install. Dev mode does not support PWA install.'
            : 'Open in Chrome or Edge (desktop/Android) or Safari (iPhone). Use the browser menu → Install app, or wait for the install banner.'}
        </p>
      </div>
    )
  }

  if (isIOSDevice && variant === 'banner' && !dismissed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <img src="/icons/icon-192x192.png" alt="" className="w-12 h-12 rounded-lg" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">Install Inventory.co</p>
            <p className="text-sm text-gray-600 mt-1">
              Tap Share, then &quot;Add to Home Screen&quot; to install the app.
            </p>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Dismiss">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192x192.png" alt="" className="w-12 h-12 rounded-lg shadow-sm" />
            <div>
              <p className="font-semibold text-gray-900">Install Inventory.co</p>
              <p className="text-sm text-gray-600">
                {isIOSDevice
                  ? 'Tap Share, then "Add to Home Screen".'
                  : 'Install for quick access, offline use, and a full-screen app experience.'}
              </p>
            </div>
          </div>
          {!isIOSDevice && canInstall && (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-[#357abd] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {installing ? 'Installing...' : 'Install App'}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!canInstall) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
      <div className="flex items-start gap-3">
        <img src="/icons/icon-192x192.png" alt="" className="w-12 h-12 rounded-lg" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">Install Inventory.co</p>
          <p className="text-sm text-gray-600 mt-1">
            Add to your home screen for offline access and a native app feel.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="px-4 py-2 bg-primary-blue text-white rounded-lg text-sm font-semibold hover:bg-[#357abd] transition-colors disabled:opacity-50"
            >
              {installing ? 'Installing...' : 'Install'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-1 sm:hidden" aria-label="Dismiss">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default InstallApp
