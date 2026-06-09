import { useState, useEffect } from 'react'

function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShow(true)
      setTimeout(() => setShow(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShow(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!show) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-yellow-500 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Back Online</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          <span className="font-medium">Offline Mode — Using Local Database</span>
        </>
      )}
    </div>
  )
}

export default OfflineIndicator

