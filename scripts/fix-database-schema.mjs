import fs from 'fs'
import path from 'path'
import initSqlJs from 'sql.js'

const paths = [
  path.join(process.env.APPDATA || '', 'Inventory.co', 'inventory.db'),
  path.join(process.env.APPDATA || '', 'inventory-co', 'inventory.db')
]

function getColumns(db, table) {
  const cols = []
  const stmt = db.prepare(`PRAGMA table_info(${table})`)
  while (stmt.step()) cols.push(stmt.getAsObject())
  stmt.free()
  return cols
}

function addColumnIfMissing(db, table, name, definition) {
  const cols = getColumns(db, table)
  if (cols.some((col) => col.name === name)) {
    console.log(`  ${table}.${name} already exists`)
    return
  }
  db.run(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`)
  console.log(`  Added ${table}.${name}`)
}

async function fixDatabase(dbPath) {
  if (!fs.existsSync(dbPath)) return false

  console.log(`Fixing ${dbPath}`)

  const SQL = await initSqlJs({
    locateFile: (file) =>
      new URL(`../node_modules/sql.js/dist/${file}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
  })

  const db = new SQL.Database(fs.readFileSync(dbPath))

  addColumnIfMissing(db, 'products', 'barcode', 'TEXT')

  const orderCols = [
    ['unit_price', 'REAL DEFAULT 0'],
    ['list_unit_price', 'REAL DEFAULT 0'],
    ['discount', 'REAL DEFAULT 0'],
    ['total_amount', 'REAL DEFAULT 0'],
    ['staff_id', 'TEXT'],
    ['staff_name', 'TEXT'],
    ['payment_method', "TEXT DEFAULT 'cash'"]
  ]

  for (const [name, def] of orderCols) {
    addColumnIfMissing(db, 'orders', name, def)
  }

  const cols = getColumns(db, 'orders')
  if (cols.some((c) => c.name === 'staff_id')) {
    db.run('CREATE INDEX IF NOT EXISTS idx_orders_staff ON orders(staff_id)')
  }
  if (cols.some((c) => c.name === 'order_date')) {
    db.run('CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date)')
  }
  db.run('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)')

  fs.writeFileSync(dbPath, Buffer.from(db.export()))
  db.close()
  console.log('Done.')
  return true
}

let fixed = false
for (const dbPath of paths) {
  if (await fixDatabase(dbPath)) fixed = true
}

if (!fixed) {
  console.log('No inventory.db found.')
}
