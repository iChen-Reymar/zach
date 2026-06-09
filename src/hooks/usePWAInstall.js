import { useState, useEffect, useCallback } from 'react'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(isStandalone)
  const [isIOSDevice] = useState(isIOS)

  useEffect(() => {
    const onInstallable = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const onDisplayModeChange = () => setIsInstalled(isStandalone())

    window.addEventListener('beforeinstallprompt', onInstallable)
    window.addEventListener('appinstalled', onInstalled)
    mediaQuery.addEventListener('change', onDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallable)
      window.removeEventListener('appinstalled', onInstalled)
      mediaQuery.removeEventListener('change', onDisplayModeChange)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)

    if (outcome === 'accepted') {
      setIsInstalled(true)
      return true
    }
    return false
  }, [deferredPrompt])

  const canInstall = Boolean(deferredPrompt) && !isInstalled

  return { canInstall, isInstalled, isIOSDevice, install }
}
