import { useEffect, useRef, useState } from 'react'
import { compressDataUrl } from '../utils/imageUpload'

function CameraCaptureModal({ isOpen, onClose, onCapture, title = 'Take Product Photo' }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined

    let active = true
    setError('')
    setStarting(true)

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera is not supported on this device')
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        })

        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (err) {
        console.error('Camera start failed:', err)
        setError(
          'Could not open camera. Allow camera access in your browser or app settings, then try again.'
        )
      } finally {
        if (active) setStarting(false)
      }
    }

    startCamera()

    return () => {
      active = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [isOpen])

  const handleCapture = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError('Camera is not ready yet. Please wait a moment.')
      return
    }

    setCapturing(true)
    setError('')

    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not capture photo')

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.92)
      const compressed = await compressDataUrl(rawDataUrl)

      onCapture(compressed)
      onClose()
    } catch (err) {
      console.error('Capture failed:', err)
      setError(err.message || 'Failed to capture photo')
    } finally {
      setCapturing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close camera"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-3">
            Position the shoes in the frame, then tap Capture Photo.
          </p>

          <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-[4/3]">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
            {starting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">
                Starting camera...
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={starting || capturing}
            className="flex-1 px-4 py-2.5 bg-primary-blue text-white rounded-lg font-semibold hover:bg-[#357abd] disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {capturing ? 'Saving...' : 'Capture Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CameraCaptureModal
