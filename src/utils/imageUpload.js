export const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateImageFile(file) {
  if (!file) return 'No file selected'
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Please upload a JPG, PNG, WEBP, or GIF image'
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Image must be ${MAX_FILE_SIZE_MB}MB or smaller`
  }
  return null
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const validationError = validateImageFile(file)
    if (validationError) {
      reject(new Error(validationError))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

function dataUrlByteSize(dataUrl) {
  const base64 = dataUrl.split(',')[1] || ''
  return Math.ceil((base64.length * 3) / 4)
}

export function compressDataUrl(dataUrl, maxBytes = MAX_FILE_SIZE) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not process image'))
        return
      }

      let width = image.width
      let height = image.height
      const maxDimension = 1600

      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(image, 0, 0, width, height)

      let quality = 0.92
      let result = canvas.toDataURL('image/jpeg', quality)

      while (dataUrlByteSize(result) > maxBytes && quality > 0.45) {
        quality -= 0.08
        result = canvas.toDataURL('image/jpeg', quality)
      }

      if (dataUrlByteSize(result) > maxBytes) {
        reject(new Error(`Image must be ${MAX_FILE_SIZE_MB}MB or smaller`))
        return
      }

      resolve(result)
    }
    image.onerror = () => reject(new Error('Failed to process captured image'))
    image.src = dataUrl
  })
}

export const IMAGE_ACCEPT = ACCEPTED_TYPES.join(',')
