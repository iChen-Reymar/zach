import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = process.env.ELECTRON_DEV === '1'
let mainWindow = null

function getDatabasePath() {
  return path.join(app.getPath('userData'), 'inventory.db')
}

function registerDatabaseHandlers() {
  ipcMain.handle('db:path', () => getDatabasePath())

  ipcMain.handle('db:read', () => {
    const dbPath = getDatabasePath()
    if (!fs.existsSync(dbPath)) return null
    return fs.readFileSync(dbPath)
  })

  ipcMain.handle('db:write', (_event, data) => {
    const dbPath = getDatabasePath()
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
    return true
  })
}

function createWindow() {
  const distIndex = path.join(__dirname, '../dist/index.html')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Inventory.co',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/icons/icon-512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.loadFile(distIndex)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  registerDatabaseHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
