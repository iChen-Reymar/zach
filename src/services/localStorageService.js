// Local Storage Service for Offline Data Persistence
// Stores data locally so it persists across refreshes and works offline

const STORAGE_KEYS = {
  PRODUCTS: 'inventory_products',
  CATEGORIES: 'inventory_categories',
  STAFF: 'inventory_staff',
  CUSTOMERS: 'inventory_customers',
  ORDERS: 'inventory_orders',
  USER_PROFILE: 'inventory_user_profile',
  LAST_SYNC: 'inventory_last_sync',
  OFFLINE_QUEUE: 'inventory_offline_queue'
}

export const localStorageService = {
  // Check if localStorage is available
  isAvailable() {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  },

  // Products
  saveProducts(products) {
    if (!this.isAvailable()) return false
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
      localStorage.setItem(`${STORAGE_KEYS.PRODUCTS}_timestamp`, Date.now().toString())
      return true
    } catch (e) {
      console.error('Error saving products to localStorage:', e)
      return false
    }
  },

  getProducts() {
    if (!this.isAvailable()) return null
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('Error reading products from localStorage:', e)
      return null
    }
  },

  // Categories
  saveCategories(categories) {
    if (!this.isAvailable()) return false
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories))
      localStorage.setItem(`${STORAGE_KEYS.CATEGORIES}_timestamp`, Date.now().toString())
      return true
    } catch (e) {
      console.error('Error saving categories to localStorage:', e)
      return false
    }
  },

  getCategories() {
    if (!this.isAvailable()) return null
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('Error reading categories from localStorage:', e)
      return null
    }
  },

  // Staff
  saveStaff(staff) {
    if (!this.isAvailable()) return false
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff))
      localStorage.setItem(`${STORAGE_KEYS.STAFF}_timestamp`, Date.now().toString())
      return true
    } catch (e) {
      console.error('Error saving staff to localStorage:', e)
      return false
    }
  },

  getStaff() {
    if (!this.isAvailable()) return null
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('Error reading staff from localStorage:', e)
      return null
    }
  },

  // Customers
  saveCustomers(customers) {
    if (!this.isAvailable()) return false
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers))
      localStorage.setItem(`${STORAGE_KEYS.CUSTOMERS}_timestamp`, Date.now().toString())
      return true
    } catch (e) {
      console.error('Error saving customers to localStorage:', e)
      return false
    }
  },

  getCustomers() {
    if (!this.isAvailable()) return null
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('Error reading customers from localStorage:', e)
      return null
    }
  },

  // Orders
  saveOrders(orders) {
    if (!this.isAvailable()) return false
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders))
      localStorage.setItem(`${STORAGE_KEYS.ORDERS}_timestamp`, Date.now().toString())
      return true
    } catch (e) {
      console.error('Error saving orders to localStorage:', e)
      return false
    }
  },

  getOrders() {
    if (!this.isAvailable()) return null
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('Error reading orders from localStorage:', e)
      return null
    }
  },

  // User Profile
  saveUserProfile(profile) {
    if (!this.isAvailable()) return false
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile))
      return true
    } catch (e) {
      console.error('Error saving user profile to localStorage:', e)
      return false
    }
  },

  getUserProfile() {
    if (!this.isAvailable()) return null
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('Error reading user profile from localStorage:', e)
      return null
    }
  },

  // Last Sync Time
  saveLastSync() {
    if (!this.isAvailable()) return false
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString())
      return true
    } catch (e) {
      return false
    }
  },

  getLastSync() {
    if (!this.isAvailable()) return null
    try {
      const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_SYNC)
      return timestamp ? parseInt(timestamp, 10) : null
    } catch (e) {
      return null
    }
  },

  // Offline Queue (for actions performed while offline)
  addToOfflineQueue(action) {
    if (!this.isAvailable()) return false
    try {
      const queue = this.getOfflineQueue()
      queue.push({
        ...action,
        timestamp: Date.now()
      })
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue))
      return true
    } catch (e) {
      console.error('Error adding to offline queue:', e)
      return false
    }
  },

  getOfflineQueue() {
    if (!this.isAvailable()) return []
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE)
      return data ? JSON.parse(data) : []
    } catch (e) {
      return []
    }
  },

  clearOfflineQueue() {
    if (!this.isAvailable()) return false
    try {
      localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE)
      return true
    } catch (e) {
      return false
    }
  },

  // Clear all data
  clearAll() {
    if (!this.isAvailable()) return false
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
        localStorage.removeItem(`${key}_timestamp`)
      })
      return true
    } catch (e) {
      return false
    }
  },

  // Get storage size info
  getStorageInfo() {
    if (!this.isAvailable()) return null
    try {
      let total = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length
        }
      }
      return {
        used: total,
        available: 5 * 1024 * 1024 - total, // 5MB typical limit
        percentage: (total / (5 * 1024 * 1024)) * 100
      }
    } catch (e) {
      return null
    }
  }
}

