// Offline Helper Utilities
export const isOnline = () => navigator.onLine

export const addOnlineListener = (callback) => {
  window.addEventListener('online', callback)
  return () => window.removeEventListener('online', callback)
}

export const addOfflineListener = (callback) => {
  window.addEventListener('offline', callback)
  return () => window.removeEventListener('offline', callback)
}

// Enhanced fetch with offline support
export const fetchWithOfflineSupport = async (url, options = {}) => {
  if (!isOnline()) {
    throw new Error('Offline')
  }
  
  try {
    const response = await fetch(url, options)
    return response
  } catch (error) {
    if (!isOnline()) {
      throw new Error('Offline')
    }
    throw error
  }
}

