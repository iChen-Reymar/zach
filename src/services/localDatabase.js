import initSqlJs from 'sql.js/dist/sql-wasm.js'
import { isElectron } from '../utils/isElectron'

const SQLITE_STORAGE_KEY = 'inventory_co_sqlite'
const DEFAULT_ADMIN_EMAIL = 'zach@gmail.com'
const DEFAULT_ADMIN_PASSWORD = 'admin123'
const IDB_NAME = 'inventory_co_storage'
const IDB_STORE = 'database'
const LEGACY_IDB_NAME = 'inventory_co_db'
const LEGACY_IDB_VERSION = 1

let db = null
let initPromise = null
let persistTimer = null

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    balance REAL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT,
    item_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    stock INTEGER NOT NULL,
    price REAL DEFAULT 0,
    status TEXT NOT NULL,
    category_id TEXT,
    category_name TEXT,
    image TEXT,
    barcode TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

  CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    staff_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL,
    user_id TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_staff_user ON staff(user_id);
  CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);

  
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL,
    user_id TEXT,
    status TEXT NOT NULL,
    approved_by TEXT,
    approved_at TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);
  CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    product_id TEXT,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL DEFAULT 0,
    list_unit_price REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    staff_id TEXT,
    staff_name TEXT,
    payment_method TEXT DEFAULT 'cash',
    order_date TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
  CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`

function openStorageDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IDB_STORE)
    }
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function getWasmPath() {
  return new URL('./sql-wasm.wasm', window.location.href).href
}

async function loadSqliteFile() {
  if (isElectron()) {
    const data = await window.electronAPI.readDatabase()
    if (!data) return null
    return data instanceof Uint8Array ? data : new Uint8Array(data)
  }

  const idb = await openStorageDb()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly')
    const get = tx.objectStore(IDB_STORE).get(SQLITE_STORAGE_KEY)
    get.onsuccess = () => resolve(get.result || null)
    get.onerror = () => reject(get.error)
  })
}

async function saveSqliteFile(data) {
  if (isElectron()) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
    await window.electronAPI.writeDatabase(bytes)
    return
  }

  const idb = await openStorageDb()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(data, SQLITE_STORAGE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function schedulePersist() {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    if (!db) return
    try {
      const data = db.export()
      saveSqliteFile(data).catch((err) => console.error('SQLite persist failed:', err))
    } catch (err) {
      console.error('SQLite export failed:', err)
    }
  }, 250)
}

function persistNow() {
  clearTimeout(persistTimer)
  if (!db) return Promise.resolve()
  const data = db.export()
  return saveSqliteFile(data)
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params)
  return rows[0] || null
}

function run(sql, params = []) {
  db.run(sql, params)
  schedulePersist()
}

function runSafe(label, fn) {
  try {
    fn()
    return true
  } catch (err) {
    console.warn(`Database step skipped (${label}):`, err?.message || err)
    return false
  }
}

function getTableColumns(table) {
  return queryAll(`PRAGMA table_info(${table})`)
}

function hasColumn(table, name) {
  return getTableColumns(table).some((col) => col.name === name)
}

function applySchemaSafely() {
  const statements = SCHEMA.split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    runSafe('schema', () => db.run(statement))
  }
}

function addColumnIfMissing(table, name, definition) {
  if (hasColumn(table, name)) return true
  return runSafe(`${table}.${name}`, () => db.run(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`))
}

function rebuildOrdersTableIfNeeded() {
  const cols = getTableColumns('orders')
  if (cols.length === 0) return

  const required = ['staff_id', 'staff_name', 'unit_price', 'total_amount', 'payment_method']
  if (required.every((name) => cols.some((col) => col.name === name))) return

  runSafe('orders-rebuild', () => {
    db.run('ALTER TABLE orders RENAME TO orders_backup')
    db.run(`
      CREATE TABLE orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        product_id TEXT,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL DEFAULT 0,
        list_unit_price REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        total_amount REAL DEFAULT 0,
        staff_id TEXT,
        staff_name TEXT,
        payment_method TEXT DEFAULT 'cash',
        order_date TEXT NOT NULL
      )
    `)

    const backupCols = getTableColumns('orders_backup').map((col) => col.name)
    const copyCols = ['id', 'customer_id', 'product_id', 'product_name', 'quantity', 'order_date']
      .filter((name) => backupCols.includes(name))

    if (copyCols.length > 0) {
      db.run(
        `INSERT INTO orders (${copyCols.join(', ')})
         SELECT ${copyCols.join(', ')} FROM orders_backup`
      )
    }

    db.run('DROP TABLE orders_backup')
  })
}

function migrateSchema() {
  if (getTableColumns('products').length > 0) {
    addColumnIfMissing('products', 'barcode', 'TEXT')
    if (hasColumn('products', 'barcode')) {
      runSafe('products-barcode-index', () => db.run('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)'))
    }
  }

  if (getTableColumns('orders').length === 0) return

  addColumnIfMissing('orders', 'unit_price', 'REAL DEFAULT 0')
  addColumnIfMissing('orders', 'list_unit_price', 'REAL DEFAULT 0')
  addColumnIfMissing('orders', 'discount', 'REAL DEFAULT 0')
  addColumnIfMissing('orders', 'total_amount', 'REAL DEFAULT 0')
  addColumnIfMissing('orders', 'staff_id', 'TEXT')
  addColumnIfMissing('orders', 'staff_name', 'TEXT')
  addColumnIfMissing('orders', 'payment_method', "TEXT DEFAULT 'cash'")

  rebuildOrdersTableIfNeeded()

  if (hasColumn('orders', 'staff_id')) {
    runSafe('orders-staff-index', () => db.run('CREATE INDEX IF NOT EXISTS idx_orders_staff ON orders(staff_id)'))
  }
  if (hasColumn('orders', 'order_date')) {
    runSafe('orders-date-index', () => db.run('CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date)'))
  }
}

function rowToUser(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    salt: row.salt,
    created_at: row.created_at
  }
}

function rowToProfile(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    balance: row.balance ?? 0,
    created_at: row.created_at
  }
}

function rowToCategory(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    item_count: row.item_count ?? 0,
    created_at: row.created_at
  }
}

function rowToProduct(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    stock: row.stock,
    price: row.price ?? 0,
    status: row.status,
    category_id: row.category_id,
    category_name: row.category_name,
    image: row.image,
    barcode: row.barcode || null,
    created_at: row.created_at
  }
}

function rowToStaff(row) {
  if (!row) return null
  return {
    id: row.id,
    staff_id: row.staff_id,
    name: row.name,
    email: row.email,
    role: row.role,
    user_id: row.user_id,
    created_at: row.created_at
  }
}

function rowToCustomer(row) {
  if (!row) return null
  return {
    id: row.id,
    customer_id: row.customer_id,
    name: row.name,
    email: row.email,
    role: row.role,
    user_id: row.user_id,
    status: row.status,
    approved_by: row.approved_by,
    approved_at: row.approved_at,
    created_at: row.created_at
  }
}

function rowToOrder(row) {
  if (!row) return null
  return {
    id: row.id,
    customer_id: row.customer_id,
    product_id: row.product_id,
    product_name: row.product_name,
    quantity: row.quantity,
    unit_price: row.unit_price ?? 0,
    list_unit_price: row.list_unit_price ?? row.unit_price ?? 0,
    discount: row.discount ?? 0,
    total_amount: row.total_amount ?? 0,
    staff_id: row.staff_id || null,
    staff_name: row.staff_name || null,
    payment_method: row.payment_method || 'cash',
    order_date: row.order_date
  }
}

async function migrateFromLegacyIndexedDB() {
  const userCount = queryOne('SELECT COUNT(*) AS count FROM users')
  if (userCount?.count > 0) return

  const legacyData = await readLegacyIndexedDB()
  if (!legacyData) return

  db.run('BEGIN')
  try {
    const exec = (sql, params = []) => db.run(sql, params)

    for (const user of legacyData.users || []) {
      exec(
        'INSERT OR IGNORE INTO users (id, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.email, user.passwordHash, user.salt, user.created_at]
      )
    }
    for (const profile of legacyData.profiles || []) {
      exec(
        'INSERT OR IGNORE INTO profiles (id, name, email, role, balance, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [profile.id, profile.name, profile.email, profile.role, profile.balance ?? 0, profile.created_at]
      )
    }
    for (const cat of legacyData.categories || []) {
      exec(
        'INSERT OR IGNORE INTO categories (id, name, image, item_count, created_at) VALUES (?, ?, ?, ?, ?)',
        [cat.id, cat.name, cat.image, cat.item_count ?? 0, cat.created_at]
      )
    }
    for (const product of legacyData.products || []) {
      exec(
        'INSERT OR IGNORE INTO products (id, name, stock, price, status, category_id, category_name, image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          product.id,
          product.name,
          product.stock,
          product.price ?? 0,
          product.status,
          product.category_id,
          product.category_name,
          product.image,
          product.created_at
        ]
      )
    }
    for (const member of legacyData.staff || []) {
      exec(
        'INSERT OR IGNORE INTO staff (id, staff_id, name, email, role, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [member.id, member.staff_id, member.name, member.email, member.role, member.user_id, member.created_at]
      )
    }
    for (const customer of legacyData.customers || []) {
      exec(
        'INSERT OR IGNORE INTO customers (id, customer_id, name, email, role, user_id, status, approved_by, approved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          customer.id,
          customer.customer_id,
          customer.name,
          customer.email,
          customer.role,
          customer.user_id,
          customer.status,
          customer.approved_by,
          customer.approved_at,
          customer.created_at
        ]
      )
    }
    for (const order of legacyData.orders || []) {
      exec(
        'INSERT OR IGNORE INTO orders (id, customer_id, product_id, product_name, quantity, order_date) VALUES (?, ?, ?, ?, ?, ?)',
        [
          order.id,
          order.customer_id,
          order.product_id,
          order.product_name,
          order.quantity,
          order.order_date
        ]
      )
    }
    for (const meta of legacyData.meta || []) {
      exec('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [meta.key, meta.value])
    }
    db.run('COMMIT')
    await persistNow()
    console.info('Migrated data from legacy IndexedDB to SQLite')
  } catch (err) {
    db.run('ROLLBACK')
    throw err
  }
}

function readLegacyIndexedDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open(LEGACY_IDB_NAME, LEGACY_IDB_VERSION)
    request.onerror = () => resolve(null)
    request.onsuccess = async () => {
      const idb = request.result
      const storeNames = Array.from(idb.objectStoreNames)
      if (storeNames.length === 0) {
        resolve(null)
        return
      }

      const readStore = (name) =>
        new Promise((res, rej) => {
          const tx = idb.transaction(name, 'readonly')
          const getAll = tx.objectStore(name).getAll()
          getAll.onsuccess = () => res(getAll.result || [])
          getAll.onerror = () => rej(getAll.error)
        })

      try {
        const data = {}
        for (const name of storeNames) {
          data[name] = await readStore(name)
        }
        resolve(data)
      } catch {
        resolve(null)
      }
    }
  })
}

async function ensureDefaultAdmin() {
  const userCount = queryOne('SELECT COUNT(*) AS count FROM users')
  if (userCount?.count > 0) return

  const userId = generateId()
  const now = new Date().toISOString()
  const { passwordHash, salt } = await hashPassword(DEFAULT_ADMIN_PASSWORD)

  run(
    'INSERT INTO users (id, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)',
    [userId, DEFAULT_ADMIN_EMAIL, passwordHash, salt, now]
  )
  run(
    'INSERT INTO profiles (id, name, email, role, balance, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, 'Administrator', DEFAULT_ADMIN_EMAIL, 'Admin', 0, now]
  )
  await persistNow()
}

async function initDatabaseInternal() {
  const SQL = await initSqlJs({ locateFile: () => getWasmPath() })
  const saved = await loadSqliteFile()

  if (saved) {
    db = new SQL.Database(saved)
  } else {
    db = new SQL.Database()
  }

  applySchemaSafely()
  migrateSchema()

  try {
    await migrateFromLegacyIndexedDB()
  } catch (err) {
    console.warn('Legacy migration skipped:', err?.message || err)
  }

  try {
    await ensureDefaultAdmin()
  } catch (err) {
    console.warn('Default admin setup skipped:', err?.message || err)
  }

  await persistNow()
}

export function getDefaultAdminCredentials() {
  return {
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD
  }
}

export function generateId() {
  return crypto.randomUUID()
}

export async function hashPassword(password) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, '0')).join('')
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const passwordHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return { passwordHash, salt }
}

export async function verifyPassword(password, passwordHash, salt) {
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hash === passwordHash
}

export async function initDatabase() {
  if (!initPromise) {
    initPromise = initDatabaseInternal().catch((err) => {
      initPromise = null
      throw err
    })
  }
  return initPromise
}

async function clearStoredDatabaseFile() {
  if (isElectron()) {
    if (window.electronAPI?.writeDatabase) {
      await window.electronAPI.writeDatabase(new Uint8Array())
    }
    return
  }

  const idb = await openStorageDb()
  await new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).delete(SQLITE_STORAGE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function resetLocalDatabase() {
  initPromise = null
  db = null
  await clearStoredDatabaseFile()
  return initDatabase()
}

export const localDatabase = {
  async countUsers() {
    const row = queryOne('SELECT COUNT(*) AS count FROM users')
    return row?.count ?? 0
  },

  async getUserByEmail(email) {
    const row = queryOne('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()])
    return rowToUser(row)
  },

  async getUserById(id) {
    const row = queryOne('SELECT * FROM users WHERE id = ?', [id])
    return rowToUser(row)
  },

  async createUser({ email, passwordHash, salt }) {
    const user = {
      id: generateId(),
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      created_at: new Date().toISOString()
    }
    run(
      'INSERT INTO users (id, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.email, user.passwordHash, user.salt, user.created_at]
    )
    return user
  },

  async getSessionUserId() {
    const row = queryOne('SELECT value FROM meta WHERE key = ?', ['sessionUserId'])
    return row?.value ?? null
  },

  async setSessionUserId(userId) {
    if (userId) {
      run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', ['sessionUserId', userId])
    } else {
      run('DELETE FROM meta WHERE key = ?', ['sessionUserId'])
    }
  },

  async getProfile(userId) {
    const row = queryOne('SELECT * FROM profiles WHERE id = ?', [userId])
    return rowToProfile(row)
  },

  async getProfileByEmail(email) {
    const row = queryOne('SELECT * FROM profiles WHERE email = ?', [email.trim().toLowerCase()])
    return rowToProfile(row)
  },

  async getAllProfiles() {
    return queryAll('SELECT * FROM profiles').map(rowToProfile)
  },

  async saveProfile(profile) {
    run(
      'INSERT OR REPLACE INTO profiles (id, name, email, role, balance, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [profile.id, profile.name, profile.email, profile.role, profile.balance ?? 0, profile.created_at]
    )
    return profile
  },

  async updateProfile(userId, updates) {
    const existing = await this.getProfile(userId)
    if (!existing) return null
    const updated = { ...existing, ...updates, id: userId }
    await this.saveProfile(updated)
    return updated
  },

  async getAllCategories() {
    const rows = queryAll('SELECT * FROM categories ORDER BY name ASC')
    return rows.map(rowToCategory)
  },

  async getCategoryById(id) {
    const row = queryOne('SELECT * FROM categories WHERE id = ?', [id])
    return rowToCategory(row)
  },

  async saveCategory(category) {
    run(
      'INSERT OR REPLACE INTO categories (id, name, image, item_count, created_at) VALUES (?, ?, ?, ?, ?)',
      [category.id, category.name, category.image, category.item_count ?? 0, category.created_at]
    )
    return category
  },

  async deleteCategory(id) {
    run('DELETE FROM categories WHERE id = ?', [id])
    return true
  },

  async getAllProducts() {
    const rows = queryAll('SELECT * FROM products ORDER BY created_at DESC')
    return rows.map(rowToProduct)
  },

  async getProductById(id) {
    const row = queryOne('SELECT * FROM products WHERE id = ?', [id])
    return rowToProduct(row)
  },

  async getProductByBarcode(barcode) {
    const row = queryOne('SELECT * FROM products WHERE barcode = ?', [barcode])
    return rowToProduct(row)
  },

  async countProductsByCategory(categoryId) {
    const row = queryOne('SELECT COUNT(*) AS count FROM products WHERE category_id = ?', [categoryId])
    return row?.count ?? 0
  },

  async saveProduct(product) {
    run(
      `INSERT OR REPLACE INTO products
        (id, name, stock, price, status, category_id, category_name, image, barcode, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.name,
        product.stock,
        product.price ?? 0,
        product.status,
        product.category_id,
        product.category_name,
        product.image,
        product.barcode || null,
        product.created_at
      ]
    )
    return product
  },
  

  async deleteProduct(id) {
    run('DELETE FROM products WHERE id = ?', [id])
    return true
  },

  async decrementProductStock(productId, quantity) {
    const product = await this.getProductById(productId)
    if (!product) {
      return { success: false, error: 'Product not found' }
    }
    if (product.stock < quantity) {
      return { success: false, error: 'Insufficient stock' }
    }

    const newStock = product.stock - quantity
    let status = 'Active'
    if (newStock === 0) status = 'Sold'
    else if (newStock <= 2) status = 'Low stock'

    const updated = { ...product, stock: newStock, status }
    await this.saveProduct(updated)
    return { success: true, product: updated }
  },

  async getAllStaff() {
    const rows = queryAll('SELECT * FROM staff ORDER BY created_at DESC')
    return rows.map(rowToStaff)
  },

  async getStaffById(id) {
    const row = queryOne('SELECT * FROM staff WHERE id = ?', [id])
    return rowToStaff(row)
  },

  async getStaffByUserId(userId) {
    const row = queryOne('SELECT * FROM staff WHERE user_id = ? LIMIT 1', [userId])
    return rowToStaff(row)
  },

  async saveStaff(staff) {
    run(
      'INSERT OR REPLACE INTO staff (id, staff_id, name, email, role, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [staff.id, staff.staff_id, staff.name, staff.email, staff.role, staff.user_id, staff.created_at]
    )
    return staff
  },

  async deleteStaff(id) {
    run('DELETE FROM staff WHERE id = ?', [id])
    return true
  },

  async searchProfiles(searchTerm) {
    const term = `%${searchTerm.toLowerCase().trim()}%`
    const rows = queryAll(
      'SELECT * FROM profiles WHERE LOWER(email) LIKE ? OR LOWER(name) LIKE ?',
      [term, term]
    )
    return rows.map(rowToProfile)
  },

  async getAllCustomers() {
    const rows = queryAll('SELECT * FROM customers ORDER BY created_at DESC')
    return rows.map(rowToCustomer)
  },

  async getCustomerById(id) {
    const row = queryOne('SELECT * FROM customers WHERE id = ?', [id])
    return rowToCustomer(row)
  },

  async getCustomerByUserId(userId) {
    const row = queryOne('SELECT * FROM customers WHERE user_id = ? LIMIT 1', [userId])
    return rowToCustomer(row)
  },

  async getCustomerByEmail(email) {
    const row = queryOne('SELECT * FROM customers WHERE LOWER(email) = ?', [email.trim().toLowerCase()])
    return rowToCustomer(row)
  },

  async saveCustomer(customer) {
    run(
      `INSERT OR REPLACE INTO customers
        (id, customer_id, name, email, role, user_id, status, approved_by, approved_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.id,
        customer.customer_id,
        customer.name,
        customer.email,
        customer.role,
        customer.user_id,
        customer.status,
        customer.approved_by,
        customer.approved_at,
        customer.created_at
      ]
    )
    return customer
  },

  async deleteCustomer(id) {
    run('DELETE FROM customers WHERE id = ?', [id])
    return true
  },

  async getPendingCustomers() {
    const rows = queryAll(
      "SELECT * FROM customers WHERE status = 'pending' ORDER BY created_at DESC"
    )
    return rows.map(rowToCustomer)
  },

  async getAllOrders() {
    const rows = queryAll('SELECT * FROM orders ORDER BY order_date DESC')
    return rows.map(rowToOrder)
  },

  async getOrdersByCustomerId(customerId) {
    const rows = queryAll(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC',
      [customerId]
    )
    return rows.map(rowToOrder)
  },

  async getOrderById(id) {
    const row = queryOne('SELECT * FROM orders WHERE id = ?', [id])
    return rowToOrder(row)
  },

  async saveOrder(order) {
    run(
      `INSERT OR REPLACE INTO orders
        (id, customer_id, product_id, product_name, quantity, unit_price, list_unit_price, discount, total_amount, staff_id, staff_name, payment_method, order_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.customer_id,
        order.product_id,
        order.product_name,
        order.quantity,
        order.unit_price ?? 0,
        order.list_unit_price ?? order.unit_price ?? 0,
        order.discount ?? 0,
        order.total_amount ?? 0,
        order.staff_id || null,
        order.staff_name || null,
        order.payment_method || 'cash',
        order.order_date
      ]
    )
    return order
  },

  async getOrdersSince(sinceIso) {
    const rows = queryAll(
      'SELECT * FROM orders WHERE order_date >= ? ORDER BY order_date DESC',
      [sinceIso]
    )
    return rows.map(rowToOrder)
  },

  async deleteOrder(id) {
    run('DELETE FROM orders WHERE id = ?', [id])
    return true
  },

  async enrichOrderWithCustomer(order) {
    if (!order) return null
    const customer = order.customer_id ? await this.getCustomerById(order.customer_id) : null
    return {
      ...order,
      customers: customer
        ? {
            customer_id: customer.customer_id,
            name: customer.name,
            email: customer.email
          }
        : null
    }
  },

  async exportDatabase() {
    await persistNow()
    return db.export()
  },

  async getTableStats() {
    const tables = ['users', 'profiles', 'categories', 'products', 'staff', 'customers', 'orders']
    const stats = {}
    for (const table of tables) {
      const row = queryOne(`SELECT COUNT(*) AS count FROM ${table}`)
      stats[table] = row?.count ?? 0
    }
    return stats
  },

  async clearAllDataExceptAdmin() {
    const adminProfiles = queryAll("SELECT id FROM profiles WHERE role = 'Admin'")
    const adminIds = [...new Set(adminProfiles.map((p) => p.id))]

    const defaultAdmin = queryOne('SELECT id FROM users WHERE email = ?', [DEFAULT_ADMIN_EMAIL])
    if (defaultAdmin?.id && !adminIds.includes(defaultAdmin.id)) {
      adminIds.push(defaultAdmin.id)
    }
    

    db.run('BEGIN')
    try {
      const exec = (sql, params = []) => db.run(sql, params)

      exec('DELETE FROM orders')
      exec('DELETE FROM products')
      exec('DELETE FROM categories')
      exec('DELETE FROM customers')
      exec('DELETE FROM staff')

      if (adminIds.length > 0) {
        const placeholders = adminIds.map(() => '?').join(',')
        exec(`DELETE FROM users WHERE id NOT IN (${placeholders})`, adminIds)
        exec(`DELETE FROM profiles WHERE id NOT IN (${placeholders})`, adminIds)
      } else {
        exec('DELETE FROM users')
        exec('DELETE FROM profiles')
      }

      exec('DELETE FROM meta WHERE key = ?', ['sessionUserId'])

      db.run('COMMIT')
      await persistNow()
      await ensureDefaultAdmin()
      return { keptAdmins: adminIds.length || 1 }
    } catch (err) {
      db.run('ROLLBACK')
      throw err
    }
  }
}
