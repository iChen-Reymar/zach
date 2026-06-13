import fs from 'fs'
import path from 'path'
import initSqlJs from 'sql.js'

const DEFAULT_ADMIN_EMAIL = 'zach@gmail.com'
const paths = [
  path.join(process.env.APPDATA || '', 'Inventory.co', 'inventory.db'),
  path.join(process.env.APPDATA || '', 'inventory-co', 'inventory.db')
]

async function resetDatabase(dbPath) {
  if (!fs.existsSync(dbPath)) return false

  const SQL = await initSqlJs({
    locateFile: (file) => new URL(`../node_modules/sql.js/dist/${file}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
  })

  const fileBuffer = fs.readFileSync(dbPath)
  const db = new SQL.Database(fileBuffer)

  const adminProfiles = []
  const stmt = db.prepare("SELECT id FROM profiles WHERE role = 'Admin'")
  while (stmt.step()) {
    adminProfiles.push(stmt.getAsObject().id)
  }
  stmt.free()

  const defaultStmt = db.prepare('SELECT id FROM users WHERE email = ?')
  defaultStmt.bind([DEFAULT_ADMIN_EMAIL])
  if (defaultStmt.step()) {
    const id = defaultStmt.getAsObject().id
    if (!adminProfiles.includes(id)) adminProfiles.push(id)
  }
  defaultStmt.free()

  const exec = (sql, params = []) => db.run(sql, params)

  db.run('BEGIN')
  try {
    exec('DELETE FROM orders')
    exec('DELETE FROM products')
    exec('DELETE FROM categories')
    exec('DELETE FROM customers')
    exec('DELETE FROM staff')

    if (adminProfiles.length > 0) {
      const placeholders = adminProfiles.map(() => '?').join(',')
      exec(`DELETE FROM users WHERE id NOT IN (${placeholders})`, adminProfiles)
      exec(`DELETE FROM profiles WHERE id NOT IN (${placeholders})`, adminProfiles)
    } else {
      exec('DELETE FROM users')
      exec('DELETE FROM profiles')
    }

    exec('DELETE FROM meta WHERE key = ?', ['sessionUserId'])
    db.run('COMMIT')
  } catch (err) {
    db.run('ROLLBACK')
    throw err
  }

  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
  db.close()

  console.log(`Reset complete: ${dbPath}`)
  console.log(`Kept ${adminProfiles.length} admin account(s)`)
  return true
}

let cleared = false
for (const dbPath of paths) {
  if (await resetDatabase(dbPath)) cleared = true
}

if (!cleared) {
  console.log('No inventory.db file found. Open the app and use Settings → Clear all data (keep admin).')
}
