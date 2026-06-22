export const SHOE_SIZE_LABEL = 'EU'

export const SHOE_SIZES = [
  '35', '36', '37', '38', '39', '40',
  '41', '42', '43', '44', '45', '46'
]

export function createEmptySizeStock() {
  return Object.fromEntries(SHOE_SIZES.map((size) => [size, '']))
}

export function normalizeSizes(sizes) {
  if (!sizes || typeof sizes !== 'object') return {}
  const normalized = {}
  for (const [size, qty] of Object.entries(sizes)) {
    const parsed = parseInt(qty, 10)
    if (parsed > 0) normalized[size] = parsed
  }
  return normalized
}

export function getTotalStockFromSizes(sizes) {
  return Object.values(normalizeSizes(sizes)).reduce((sum, qty) => sum + qty, 0)
}

export function sizesToFormState(sizes) {
  const formState = createEmptySizeStock()
  const normalized = normalizeSizes(sizes)
  for (const size of SHOE_SIZES) {
    formState[size] = normalized[size] ? String(normalized[size]) : ''
  }
  for (const [size, qty] of Object.entries(normalized)) {
    if (!SHOE_SIZES.includes(size)) {
      formState[size] = String(qty)
    }
  }
  return formState
}

export function sortSizeEntries(sizes) {
  return Object.entries(normalizeSizes(sizes)).sort(
    (a, b) => parseFloat(a[0]) - parseFloat(b[0])
  )
}

export function formatSizeLabel(size) {
  return `${SHOE_SIZE_LABEL} ${size}`
}

export function formatSizesSummary(sizes) {
  const entries = sortSizeEntries(sizes)
  if (entries.length === 0) return null
  return entries.map(([size, qty]) => `${formatSizeLabel(size)} × ${qty}`).join(' · ')
}
