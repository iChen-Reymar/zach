import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'public', 'icons')
const svgPath = join(iconsDir, 'icon.svg')
const svg = readFileSync(svgPath)

const sizes = [192, 512]

for (const size of sizes) {
  const outPath = join(iconsDir, `icon-${size}x${size}.png`)
  await sharp(svg).resize(size, size).png().toFile(outPath)
  console.log(`Created ${outPath}`)
}
