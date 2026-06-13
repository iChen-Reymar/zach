import { assetPath } from './assetPath'
import { isElectron } from './isElectron'
import { isMobileDevice } from './device'

export const DESKTOP_INSTALLER_NAME = 'Inventory.co-Setup.exe'
export const DESKTOP_INSTALLER_URL = assetPath(`downloads/${DESKTOP_INSTALLER_NAME}`)

export function isDesktopApp() {
  return isElectron()
}

export async function isInstallerAvailable() {
  if (isElectron()) return false
  try {
    const response = await fetch(DESKTOP_INSTALLER_URL, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

export function downloadDesktopApp() {
  if (isMobileDevice()) {
    window.alert(
      'The Windows installer (.exe) only works on a PC.\n\nOn your phone: tap "Get Started" or "Login" to use Zach Apparel in your browser.'
    )
    return
  }

  const link = document.createElement('a')
  link.href = DESKTOP_INSTALLER_URL
  link.download = DESKTOP_INSTALLER_NAME
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
