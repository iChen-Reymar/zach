import { useNavigate } from 'react-router-dom'
import { isMobileDevice, isAndroid, isIOSDevice } from '../utils/device'
import { isDesktopApp } from '../utils/downloadApp'
import DownloadApp from './DownloadApp'
import InstallApp from './InstallApp'
import BrandText from './BrandText'

function PhoneAppCard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <BrandText size="sm" variant="light" className="shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 text-lg">Use on Phone</p>
            <p className="text-sm text-gray-600 mt-1">
              ZCH Footwear Shop runs in your phone browser. You do <strong>not</strong> need the Windows
              file — that only works on PC.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="flex-1 px-4 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-[#357abd] transition-colors"
          >
            Get Started
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Login
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <p className="font-semibold text-gray-900 mb-2">Add to Home Screen (optional)</p>
        {isIOSDevice() ? (
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Open this page in <strong>Safari</strong></li>
            <li>Tap the <strong>Share</strong> button</li>
            <li>Tap <strong>Add to Home Screen</strong></li>
          </ol>
        ) : isAndroid() ? (
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Open this page in <strong>Chrome</strong></li>
            <li>Tap the menu (⋮) → <strong>Install app</strong> or <strong>Add to Home screen</strong></li>
          </ol>
        ) : (
          <p className="text-sm text-gray-600">
            Use your browser menu to install or add this site to your home screen for quick access.
          </p>
        )}
      </div>

      <InstallApp variant="card" />
    </div>
  )
}

function GetApp({ variant = 'card' }) {
  const mobile = isMobileDevice()
  const desktop = isDesktopApp()

  if (desktop) {
    return <DownloadApp variant="card" />
  }

  if (mobile) {
    if (variant === 'button') {
      return (
        <button
          type="button"
          onClick={() => window.location.hash = '#/signup'}
          className="px-3 py-2 sm:px-5 sm:py-2.5 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base"
        >
          Use on Phone
        </button>
      )
    }
    return <PhoneAppCard />
  }

  if (variant === 'button') {
    return <DownloadApp variant="button" />
  }

  if (variant === 'hero') {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <DownloadApp variant="hero" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DownloadApp variant="card" />
      <InstallApp variant="card" />
    </div>
  )
}

export default GetApp
