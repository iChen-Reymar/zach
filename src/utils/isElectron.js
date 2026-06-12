export function isElectron() {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron
}
