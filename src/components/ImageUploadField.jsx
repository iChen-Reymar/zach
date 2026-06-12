import { useRef, useState } from 'react'
import { fileToDataUrl, IMAGE_ACCEPT } from '../utils/imageUpload'

function ImageUploadField({ label, value, onChange, children }) {
  const fileInputRef = useRef(null)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)

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

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

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
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, or GIF up to 2MB</p>
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
    </div>
  )
}

export default ImageUploadField
