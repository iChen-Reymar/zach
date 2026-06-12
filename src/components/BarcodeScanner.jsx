import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

const SCANNER_ID = 'barcode-scanner-view'

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.QR_CODE
]

function BarcodeScanner({ isOpen, onClose, onScan }) {
  const scannerRef = useRef(null)
  const onScanRef = useRef(onScan)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const scannedRef = useRef(false)

  onScanRef.current = onScan

  useEffect(() => {
    if (!isOpen) return undefined

    scannedRef.current = false
    setError('')
    setStarting(true)

    const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false })
    scannerRef.current = scanner

    const config = {
      fps: 10,
      qrbox: { width: 280, height: 160 },
      formatsToSupport: BARCODE_FORMATS
    }

    scanner
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (scannedRef.current) return
          scannedRef.current = true
          onScanRef.current(decodedText.trim())
        },
        () => {}
      )
      .catch((err) => {
        console.error('Camera start failed:', err)
        setError(
          'Could not open camera. Allow camera access in your browser or app settings, then try again.'
        )
      })
      .finally(() => setStarting(false))

    return () => {
      const active = scannerRef.current
      scannerRef.current = null
      if (!active) return
      active
        .stop()
        .then(() => active.clear())
        .catch(() => {})
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Scan Barcode</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close scanner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-3">
            Point your camera at the product barcode. The product name will fill in automatically.
          </p>

          <div
            id={SCANNER_ID}
            className="w-full rounded-lg overflow-hidden bg-black min-h-[240px]"
          />

          {starting && (
            <p className="text-sm text-gray-500 mt-3 text-center">Starting camera...</p>
          )}
          {error && (
            <p className="text-sm text-red-600 mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner
