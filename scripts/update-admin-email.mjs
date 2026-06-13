import fs from 'fs'
import path from 'path'
import initSqlJs from 'sql.js'

const NEW_EMAIL = 'zach@gmail.com'
const OLD_EMAIL = 'admin@inventory.local'

const paths = [
  path.join(process.env.APPDATA || '', 'Inventory.co', 'inventory.db'),
  path.join(process.env.APPDATA || '', 'inventory-co', 'inventory.db')
]

async function updateAdminEmail(dbPath) {
  if (!fs.existsSync(dbPath)) return false

  const SQL = await initSqlJs({
    locateFile: (file) =>
      new URL(`../node_modules/sql.js/dist/${file}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
  })

  const db = new SQL.Database(fs.readFileSync(dbPath))
  const email = NEW_EMAIL.trim().toLowerCase()

  const oldUser = db.prepare('SELECT id FROM users WHERE email = ?')
  oldUser.bind([OLD_EMAIL])
  let userId = oldUser.step() ? oldUser.getAsObject().id : null
  oldUser.free()

  if (!userId) {
    const anyAdmin = db.prepare("SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1")
    if (anyAdmin.step()) userId = anyAdmin.getAsObject().id
    anyAdmin.free()
  }

  if (!userId) {
    console.log(`No admin user found in ${dbPath}`)
    db.close()
    return true
  }

  db.run('UPDATE users SET email = ? WHERE id = ?', [email, userId])
  db.run('UPDATE profiles SET email = ? WHERE id = ?', [email, userId])

  fs.writeFileSync(dbPath, Buffer.from(db.export()))
  db.close()
  console.log(`Updated admin email to ${email} in ${dbPath}`)
  return true
}

let updated = false
for (const dbPath of paths) {
  if (await updateAdminEmail(dbPath)) updated = true
}

if (!updated) console.log('No inventory.db found.')
