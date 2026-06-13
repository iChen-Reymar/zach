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

export const IMAGE_ACCEPT = ACCEPTED_TYPES.join(',')
