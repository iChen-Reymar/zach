import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import initSqlJs from 'sql.js'

const DB_PATHS = [
  path.join(process.env.APPDATA || '', 'ZCH Footwear Shop', 'inventory.db'),
  path.join(process.env.APPDATA || '', 'Inventory.co', 'inventory.db'),
  path.join(process.env.APPDATA || '', 'inventory-co', 'inventory.db')
]

async function clearImages(dbPath) {
  const SQL = await initSqlJs({
    locateFile: (file) =>
      new URL(`../node_modules/sql.js/dist/${file}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
  })

  const db = new SQL.Database(fs.readFileSync(dbPath))
  const exec = (sql) => db.run(sql)

  db.run('BEGIN')
  try {
    exec("UPDATE categories SET image = NULL WHERE image IS NOT NULL AND image != ''")
    exec("UPDATE products SET image = NULL WHERE image IS NOT NULL AND image != ''")
    exec("INSERT OR REPLACE INTO meta (key, value) VALUES ('clearedLegacyImages', '1')")
    db.run('COMMIT')
  } catch (err) {
    db.run('ROLLBACK')
    throw err
  }

  fs.writeFileSync(dbPath, Buffer.from(db.export()))
  db.close()
}

let cleared = 0
for (const dbPath of DB_PATHS) {
  if (!fs.existsSync(dbPath)) continue
  await clearImages(dbPath)
  console.log(`Cleared images: ${dbPath}`)
  cleared++
}

if (cleared === 0) {
  console.log('No inventory.db found. Open the app once, then run: npm run clear:images')
  process.exit(1)
}

console.log(`Done. Cleared images from ${cleared} database file(s).`)
