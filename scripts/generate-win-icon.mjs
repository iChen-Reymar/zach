import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pngToIco from 'png-to-ico'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const buildDir = path.join(root, 'build')
const iconsDir = path.join(root, 'public', 'icons')
const icoPath = path.join(buildDir, 'icon.ico')

const pngSizes = [16, 24, 32, 48, 64, 128, 256]
const pngPaths = pngSizes.map((size) => {
  const buildPng = path.join(buildDir, `icon-${size}x${size}.png`)
  if (fs.existsSync(buildPng)) return buildPng
  return path.join(iconsDir, `icon-${size}x${size}.png`)
})

const missing = pngPaths.filter((filePath) => !fs.existsSync(filePath))
if (missing.length > 0) {
  console.error('Missing icon PNGs. Run scripts/generate-icons-from-logo.ps1 first.')
  console.error(missing.join('\n'))
  process.exit(1)
}

fs.mkdirSync(buildDir, { recursive: true })
const ico = await pngToIco(pngPaths)
fs.writeFileSync(icoPath, ico)
console.log(`Created ${icoPath} from ${pngPaths.length} sizes`)
