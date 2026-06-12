import fs from 'fs'
import path from 'path'
import initSqlJs from 'sql.js'

const paths = [
  path.join(process.env.APPDATA || '', 'Inventory.co', 'inventory.db'),
  path.join(process.env.APPDATA || '', 'inventory-co', 'inventory.db')
]

async function fixDatabase(dbPath) {
  if (!fs.existsSync(dbPath)) return false

  const SQL = await initSqlJs({
    locateFile: (file) =>
      new URL(`../node_modules/sql.js/dist/${file}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
  })

  const db = new SQL.Database(fs.readFileSync(dbPath))
  const columns = []
  const stmt = db.prepare('PRAGMA table_info(products)')
  while (stmt.step()) columns.push(stmt.getAsObject())
  stmt.free()

  if (!columns.some((col) => col.name === 'barcode')) {
    db.run('ALTER TABLE products ADD COLUMN barcode TEXT')
    console.log(`Added barcode column to ${dbPath}`)
  } else {
    console.log(`Barcode column already exists in ${dbPath}`)
  }

  db.run('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)')

  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
  db.close()
  return true
}

let fixed = false
for (const dbPath of paths) {
  if (await fixDatabase(dbPath)) fixed = true
}

if (!fixed) {
  console.log('No inventory.db found to fix.')
}
