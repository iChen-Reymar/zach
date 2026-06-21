import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import initSqlJs from 'sql.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const DB_PATHS = [
  path.join(process.env.APPDATA || '', 'ZCH Footwear Shop', 'inventory.db'),
  path.join(process.env.APPDATA || '', 'Inventory.co', 'inventory.db'),
  path.join(process.env.APPDATA || '', 'inventory-co', 'inventory.db')
]

const TABLES = ['users', 'profiles', 'categories', 'products', 'staff', 'customers', 'orders', 'meta']

function stripImageFields(row) {
  const copy = { ...row }
  for (const key of Object.keys(copy)) {
    const val = copy[key]
    if (typeof val === 'string' && val.startsWith('data:image')) {
      copy[key] = `[image data, ${val.length} chars]`
    }
  }
  if (copy.password_hash) copy.password_hash = '[hidden]'
  if (copy.salt) copy.salt = '[hidden]'
  return copy
}

async function exportDatabase(dbPath, outDir) {
  const SQL = await initSqlJs({
    locateFile: (file) =>
      new URL(`../node_modules/sql.js/dist/${file}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
  })

  const db = new SQL.Database(fs.readFileSync(dbPath))
  const summary = { source: dbPath, exportedAt: new Date().toISOString(), tables: {} }
  const allData = {}

  for (const table of TABLES) {
    try {
      const rows = []
      const stmt = db.prepare(`SELECT * FROM ${table}`)
      while (stmt.step()) rows.push(stmt.getAsObject())
      stmt.free()

      summary.tables[table] = rows.length
      allData[table] = rows.map(stripImageFields)

      fs.writeFileSync(
        path.join(outDir, `${table}.json`),
        JSON.stringify(rows.map(stripImageFields), null, 2),
        'utf8'
      )
    } catch {
      summary.tables[table] = 0
      allData[table] = []
    }
  }

  fs.writeFileSync(path.join(outDir, '_summary.json'), JSON.stringify(summary, null, 2), 'utf8')
  fs.writeFileSync(path.join(outDir, 'all-data.json'), JSON.stringify(allData, null, 2), 'utf8')

  return summary
}

const dbPath = DB_PATHS.find((p) => fs.existsSync(p))
if (!dbPath) {
  console.log('No inventory.db found. Open the app first, then run: npm run export:data')
  process.exit(1)
}

const outDir = path.join(root, 'data-export')
fs.mkdirSync(outDir, { recursive: true })

const summary = await exportDatabase(dbPath, outDir)

console.log(`Exported from: ${dbPath}`)
console.log(`Output folder: ${outDir}`)
console.log('')
for (const [table, count] of Object.entries(summary.tables)) {
  console.log(`  ${table}: ${count} row(s) -> data-export/${table}.json`)
}
console.log('')
console.log('Open data-export/all-data.json to see everything in one file.')
