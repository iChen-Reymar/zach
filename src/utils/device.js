export function isMobileDevice() {
  const ua = navigator.userAgent || ''
  const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const touchNarrow = navigator.maxTouchPoints > 1 && window.innerWidth < 1024
  return mobileUa || touchNarrow
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent || '')
}

export function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent || '') && !window.MSStream
}

export function isWindowsDesktop() {
  return /Windows/i.test(navigator.userAgent || '') && !isMobileDevice()
}
