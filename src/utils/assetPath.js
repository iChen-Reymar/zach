export function assetPath(relativePath) {
  const clean = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  const base = import.meta.env.BASE_URL || './'
  return `${base}${clean}`
}
