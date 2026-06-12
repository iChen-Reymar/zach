import { useState, useEffect } from 'react'
import { isDesktopApp, isInstallerAvailable, downloadDesktopApp } from '../utils/downloadApp'
import { assetPath } from '../utils/assetPath'

function DownloadApp({ variant = 'card' }) {
  const [available, setAvailable] = useState(false)
  const [checking, setChecking] = useState(true)
  const desktop = isDesktopApp()

  useEffect(() => {
    if (desktop) {
      setChecking(false)
      return
    }
    isInstallerAvailable()
      .then(setAvailable)
      .finally(() => setChecking(false))
  }, [desktop])

  if (desktop) {
    if (variant === 'button') return null
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Desktop App Running</p>
            <p className="text-sm text-gray-600">You are using the installed offline desktop version.</p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={downloadDesktopApp}
        disabled={checking || !available}
        className="px-3 py-2 sm:px-5 sm:py-2.5 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        title={available ? 'Download Windows installer' : 'Installer not built yet — run npm run dist'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {checking ? 'Checking...' : available ? 'Download App' : 'Download Soon'}
      </button>
    )
  }

  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={downloadDesktopApp}
        disabled={checking || !available}
        className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/10 border border-cyan-400/40 text-white text-base sm:text-lg font-bold rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {checking ? 'Checking installer...' : available ? 'Download Desktop App' : 'Build installer with npm run dist'}
      </button>
    )
  }

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={assetPath('icons/icon-192x192.png')} alt="" className="w-12 h-12 rounded-lg shadow-sm" />
          <div>
            <p className="font-semibold text-gray-900">Download Desktop App</p>
            <p className="text-sm text-gray-600">
              Install Inventory.co on Windows. Works fully offline — no browser, terminal, or internet needed.
            </p>
            {!checking && !available && (
              <p className="text-xs text-amber-700 mt-1">
                Installer not found. Run <code className="bg-amber-100 px-1 rounded">npm run dist</code> to generate it.
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={downloadDesktopApp}
          disabled={checking || !available}
          className="px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-[#357abd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {checking ? 'Checking...' : 'Download for Windows'}
        </button>
      </div>
    </div>
  )
}

export default DownloadApp
