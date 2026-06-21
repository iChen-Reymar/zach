import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { rcedit } from 'rcedit'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

export default async function afterPack(context) {
  const exeName = `${context.packager.appInfo.productFilename}.exe`
  const exePath = path.join(context.appOutDir, exeName)
  const iconPath = path.join(root, 'build', 'icon.ico')
  const installedIconPath = path.join(context.appOutDir, 'icon.ico')

  fs.copyFileSync(iconPath, installedIconPath)

  await rcedit(exePath, { icon: iconPath })
  console.log(`Applied ZCH icon to ${exePath}`)
  console.log(`Copied ${installedIconPath} for desktop shortcuts`)
}
