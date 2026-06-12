import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const installerName = 'Inventory.co-Setup.exe'
const versionedName = 'Inventory.co-Setup-1.0.0.exe'
const source = path.join(root, 'release', versionedName)
const destinations = [
  path.join(root, 'public', 'downloads', installerName),
  path.join(root, 'dist', 'downloads', installerName)
]

if (!fs.existsSync(source)) {
  console.warn(`Installer not found at ${source}`)
  console.warn('Run "npm run dist" to build the Windows installer first.')
  process.exit(0)
}

for (const dest of destinations) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(source, dest)
  console.log(`Copied installer to ${dest}`)
}
