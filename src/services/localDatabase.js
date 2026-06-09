const DB_NAME = 'inventory_co_db'
const DB_VERSION = 1

const STORES = {
  USERS: 'users',
  PROFILES: 'profiles',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  STAFF: 'staff',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  META: 'meta'
}

let dbPromise = null

function openDatabase() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        if (!db.objectStoreNames.contains(STORES.USERS)) {
          const users = db.createObjectStore(STORES.USERS, { keyPath: 'id' })
          users.createIndex('email', 'email', { unique: true })
        }

        if (!db.objectStoreNames.contains(STORES.PROFILES)) {
          const profiles = db.createObjectStore(STORES.PROFILES, { keyPath: 'id' })
          profiles.createIndex('email', 'email', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const products = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' })
          products.createIndex('category_id', 'category_id', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORES.STAFF)) {
          const staff = db.createObjectStore(STORES.STAFF, { keyPath: 'id' })
          staff.createIndex('user_id', 'user_id', { unique: false })
          staff.createIndex('email', 'email', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          const customers = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' })
          customers.createIndex('user_id', 'user_id', { unique: false })
          customers.createIndex('email', 'email', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORES.ORDERS)) {
          const orders = db.createObjectStore(STORES.ORDERS, { keyPath: 'id' })
          orders.createIndex('customer_id', 'customer_id', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META, { keyPath: 'key' })
        }
      }
    })
  }

  return dbPromise
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getAll(storeName) {
  const db = await openDatabase()
  const store = db.transaction(storeName, 'readonly').objectStore(storeName)
  const result = await promisifyRequest(store.getAll())
  return result || []
}

async function getById(storeName, id) {
  const db = await openDatabase()
  const store = db.transaction(storeName, 'readonly').objectStore(storeName)
  const result = await promisifyRequest(store.get(id))
  return result || null
}

async function getByIndex(storeName, indexName, value) {
  const db = await openDatabase()
  const store = db.transaction(storeName, 'readonly').objectStore(storeName)
  const result = await promisifyRequest(store.index(indexName).get(value))
  return result || null
}

async function getAllByIndex(storeName, indexName, value) {
  const db = await openDatabase()
  const store = db.transaction(storeName, 'readonly').objectStore(storeName)
  const result = await promisifyRequest(store.index(indexName).getAll(value))
  return result || []
}

async function put(storeName, item) {
  const db = await openDatabase()
  const store = db.transaction(storeName, 'readwrite').objectStore(storeName)
  await promisifyRequest(store.put(item))
  return item
}

async function remove(storeName, id) {
  const db = await openDatabase()
  const store = db.transaction(storeName, 'readwrite').objectStore(storeName)
  await promisifyRequest(store.delete(id))
  return true
}

async function getMeta(key) {
  const record = await getById(STORES.META, key)
  return record?.value ?? null
}

async function setMeta(key, value) {
  return put(STORES.META, { key, value })
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
  await openDatabase()
}

export const localDatabase = {
  async countUsers() {
    const users = await getAll(STORES.USERS)
    return users.length
  },

  async getUserByEmail(email) {
    return getByIndex(STORES.USERS, 'email', email.trim().toLowerCase())
  },

  async getUserById(id) {
    return getById(STORES.USERS, id)
  },

  async createUser({ email, passwordHash, salt }) {
    const user = {
      id: generateId(),
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      created_at: new Date().toISOString()
    }
    await put(STORES.USERS, user)
    return user
  },

  async getSessionUserId() {
    return getMeta('sessionUserId')
  },

  async setSessionUserId(userId) {
    if (userId) {
      await setMeta('sessionUserId', userId)
    } else {
      await remove(STORES.META, 'sessionUserId')
    }
  },

  async getProfile(userId) {
    return getById(STORES.PROFILES, userId)
  },

  async getProfileByEmail(email) {
    return getByIndex(STORES.PROFILES, 'email', email.trim().toLowerCase())
  },

  async getAllProfiles() {
    return getAll(STORES.PROFILES)
  },

  async saveProfile(profile) {
    return put(STORES.PROFILES, profile)
  },

  async updateProfile(userId, updates) {
    const existing = await getById(STORES.PROFILES, userId)
    if (!existing) return null
    const updated = { ...existing, ...updates, id: userId }
    await put(STORES.PROFILES, updated)
    return updated
  },

  async getAllCategories() {
    const categories = await getAll(STORES.CATEGORIES)
    return categories.sort((a, b) => a.name.localeCompare(b.name))
  },

  async getCategoryById(id) {
    return getById(STORES.CATEGORIES, id)
  },

  async saveCategory(category) {
    return put(STORES.CATEGORIES, category)
  },

  async deleteCategory(id) {
    return remove(STORES.CATEGORIES, id)
  },

  async getAllProducts() {
    const products = await getAll(STORES.PRODUCTS)
    return products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  async getProductById(id) {
    return getById(STORES.PRODUCTS, id)
  },

  async countProductsByCategory(categoryId) {
    const products = await getAllByIndex(STORES.PRODUCTS, 'category_id', categoryId)
    return products.length
  },

  async saveProduct(product) {
    return put(STORES.PRODUCTS, product)
  },

  async deleteProduct(id) {
    return remove(STORES.PRODUCTS, id)
  },

  async decrementProductStock(productId, quantity) {
    const product = await getById(STORES.PRODUCTS, productId)
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
    await put(STORES.PRODUCTS, updated)
    return { success: true, product: updated }
  },

  async getAllStaff() {
    const staff = await getAll(STORES.STAFF)
    return staff.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  async getStaffById(id) {
    return getById(STORES.STAFF, id)
  },

  async getStaffByUserId(userId) {
    const results = await getAllByIndex(STORES.STAFF, 'user_id', userId)
    return results[0] || null
  },

  async saveStaff(staff) {
    return put(STORES.STAFF, staff)
  },

  async deleteStaff(id) {
    return remove(STORES.STAFF, id)
  },

  async searchProfiles(searchTerm) {
    const term = searchTerm.toLowerCase().trim()
    const profiles = await getAll(STORES.PROFILES)
    return profiles.filter(
      (p) => p.email?.toLowerCase().includes(term) || p.name?.toLowerCase().includes(term)
    )
  },

  async getAllCustomers() {
    const customers = await getAll(STORES.CUSTOMERS)
    return customers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  async getCustomerById(id) {
    return getById(STORES.CUSTOMERS, id)
  },

  async getCustomerByUserId(userId) {
    const results = await getAllByIndex(STORES.CUSTOMERS, 'user_id', userId)
    return results[0] || null
  },

  async getCustomerByEmail(email) {
    const normalized = email.trim().toLowerCase()
    const customers = await getAll(STORES.CUSTOMERS)
    return customers.find((c) => c.email?.trim().toLowerCase() === normalized) || null
  },

  async saveCustomer(customer) {
    return put(STORES.CUSTOMERS, customer)
  },

  async deleteCustomer(id) {
    return remove(STORES.CUSTOMERS, id)
  },

  async getPendingCustomers() {
    const customers = await getAll(STORES.CUSTOMERS)
    return customers
      .filter((c) => c.status === 'pending')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  async getAllOrders() {
    const orders = await getAll(STORES.ORDERS)
    return orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
  },

  async getOrdersByCustomerId(customerId) {
    const orders = await getAllByIndex(STORES.ORDERS, 'customer_id', customerId)
    return orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
  },

  async getOrderById(id) {
    return getById(STORES.ORDERS, id)
  },

  async saveOrder(order) {
    return put(STORES.ORDERS, order)
  },

  async deleteOrder(id) {
    return remove(STORES.ORDERS, id)
  },

  async enrichOrderWithCustomer(order) {
    if (!order) return null
    const customer = order.customer_id
      ? await getById(STORES.CUSTOMERS, order.customer_id)
      : null
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
  }
}
