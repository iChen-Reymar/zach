import { useRef, useState } from 'react'
import CameraCaptureModal from './CameraCaptureModal'
import { fileToDataUrl, IMAGE_ACCEPT, MAX_FILE_SIZE_MB } from '../utils/imageUpload'

function ImageUploadField({ label, value, onChange, children, enableCamera = true }) {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)

  const handleUrlChange = (e) => {
    setUploadError('')
    onChange(e.target.value)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError('')
    try {
      const dataUrl = await fileToDataUrl(file)
      onChange(dataUrl)
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleCameraCapture = (dataUrl) => {
    setUploadError('')
    onChange(dataUrl)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {enableCamera && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">Capture with camera</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-[#357abd] transition-colors text-sm font-medium disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Take Photo
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 sm:hidden"
            >
              Phone Camera
            </button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-2">Upload from computer</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Choose Image File'}
        </button>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, or GIF up to {MAX_FILE_SIZE_MB}MB</p>
        {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-2">Or enter image URL</p>
        <input
          type="text"
          value={value}
          onChange={handleUrlChange}
          placeholder="https://example.com/image.jpg"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
        />
      </div>

      {value && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">Preview:</p>
          <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-300">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML =
                  '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">Invalid</div>'
              }}
            />
          </div>
        </div>
      )}

      {children}

      {enableCamera && (
        <CameraCaptureModal
          isOpen={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={handleCameraCapture}
          title="Capture Shoe Photo"
        />
      )}
    </div>
  )
}

export default ImageUploadField
