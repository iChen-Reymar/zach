import { requireSupabase } from '../lib/supabase'
import { normalizeSizes, getTotalStockFromSizes } from '../utils/shoeSizes'

export const DEFAULT_ADMIN_EMAIL = 'zach@gmail.com'

export function generateId() {
  return crypto.randomUUID()
}

function throwIfError(error, fallbackMessage) {
  if (error) {
    throw new Error(error.message || fallbackMessage)
  }
}

function mapProfile(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    balance: Number(row.balance) || 0,
    created_at: row.created_at
  }
}

function mapCategory(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    item_count: row.item_count ?? 0,
    created_at: row.created_at
  }
}

function mapProduct(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    stock: row.stock,
    price: Number(row.price) || 0,
    cost: Number(row.cost) || 0,
    status: row.status,
    category_id: row.category_id,
    category_name: row.category_name,
    image: row.image,
    barcode: row.barcode || null,
    sizes: row.sizes && typeof row.sizes === 'object' ? row.sizes : null,
    created_at: row.created_at
  }
}

function mapStaff(row) {
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

function mapCustomer(row) {
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

function mapOrder(row) {
  if (!row) return null
  const customer = row.customers || null
  return {
    id: row.id,
    customer_id: row.customer_id,
    product_id: row.product_id,
    product_name: row.product_name,
    quantity: row.quantity,
    unit_price: Number(row.unit_price) || 0,
    list_unit_price: Number(row.list_unit_price) || Number(row.unit_price) || 0,
    discount: Number(row.discount) || 0,
    total_amount: Number(row.total_amount) || 0,
    staff_id: row.staff_id || null,
    staff_name: row.staff_name || null,
    payment_method: row.payment_method || 'cash',
    size: row.size || null,
    debtor_name: row.debtor_name || null,
    utang_paid: !!row.utang_paid,
    utang_paid_at: row.utang_paid_at || null,
    utang_paid_method: row.utang_paid_method || null,
    utang_paid_amount: Number(row.utang_paid_amount) || 0,
    stock_deducted: !!row.stock_deducted,
    order_date: row.order_date,
    customers: customer
      ? {
          customer_id: customer.customer_id,
          name: customer.name,
          email: customer.email
        }
      : null
  }
}

const ORDER_SELECT = `
  *,
  customers ( customer_id, name, email )
`

export async function initSupabase() {
  const supabase = requireSupabase()
  const { error } = await supabase.auth.getSession()
  if (error) throw error
}

export const supabaseDatabase = {
  async countProfiles() {
    const supabase = requireSupabase()
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    throwIfError(error, 'Failed to count profiles')
    return count ?? 0
  },

  async getProfile(userId) {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    throwIfError(error, 'Failed to load profile')
    return mapProfile(data)
  },

  async getProfileByEmail(email) {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()
    throwIfError(error, 'Failed to load profile')
    return mapProfile(data)
  },

  async getAllProfiles() {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('profiles').select('*')
    throwIfError(error, 'Failed to load profiles')
    return (data || []).map(mapProfile)
  },

  async saveProfile(profile) {
    const supabase = requireSupabase()
    const row = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      balance: profile.balance ?? 0,
      created_at: profile.created_at || new Date().toISOString()
    }
    const { data, error } = await supabase.from('profiles').upsert(row).select('*').single()
    throwIfError(error, 'Failed to save profile')
    return mapProfile(data)
  },

  async updateProfile(userId, updates) {
    const existing = await this.getProfile(userId)
    if (!existing) return null
    return this.saveProfile({ ...existing, ...updates, id: userId })
  },

  async searchProfiles(searchTerm) {
    const supabase = requireSupabase()
    const term = searchTerm.trim()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`email.ilike.%${term}%,name.ilike.%${term}%`)
    throwIfError(error, 'Failed to search profiles')
    return (data || []).map(mapProfile)
  },

  async getAllCategories() {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('categories').select('*').order('name')
    throwIfError(error, 'Failed to load categories')
    return (data || []).map(mapCategory)
  },

  async getCategoryById(id) {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle()
    throwIfError(error, 'Failed to load category')
    return mapCategory(data)
  },

  async saveCategory(category) {
    const supabase = requireSupabase()
    const row = {
      id: category.id,
      name: category.name,
      image: category.image,
      item_count: category.item_count ?? 0,
      created_at: category.created_at || new Date().toISOString()
    }
    const { data, error } = await supabase.from('categories').upsert(row).select('*').single()
    throwIfError(error, 'Failed to save category')
    return mapCategory(data)
  },

  async deleteCategory(id) {
    const supabase = requireSupabase()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    throwIfError(error, 'Failed to delete category')
    return true
  },

  async getAllProducts() {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    throwIfError(error, 'Failed to load products')
    return (data || []).map(mapProduct)
  },

  async getProductById(id) {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
    throwIfError(error, 'Failed to load product')
    return mapProduct(data)
  },

  async getProductByBarcode(barcode) {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('products').select('*').eq('barcode', barcode).maybeSingle()
    throwIfError(error, 'Failed to load product')
    return mapProduct(data)
  },

  async countProductsByCategory(categoryId) {
    const supabase = requireSupabase()
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
    throwIfError(error, 'Failed to count products')
    return count ?? 0
  },

  async saveProduct(product) {
    const supabase = requireSupabase()
    const row = {
      id: product.id,
      name: product.name,
      stock: product.stock,
      price: product.price ?? 0,
      cost: product.cost ?? 0,
      status: product.status,
      category_id: product.category_id,
      category_name: product.category_name,
      image: product.image,
      barcode: product.barcode || null,
      sizes: product.sizes || null,
      created_at: product.created_at || new Date().toISOString()
    }
    const { data, error } = await supabase.from('products').upsert(row).select('*').single()
    throwIfError(error, 'Failed to save product')
    return mapProduct(data)
  },

  async deleteProduct(id) {
    const supabase = requireSupabase()
    const { error } = await supabase.from('products').delete().eq('id', id)
    throwIfError(error, 'Failed to delete product')
    return true
  },

  async decrementProductStock(productId, quantity, size = null) {
    const product = await this.getProductById(productId)
    if (!product) {
      return { success: false, error: 'Product not found' }
    }

    const sizes = normalizeSizes(product.sizes)
    const hasSizes = Object.keys(sizes).length > 0

    if (hasSizes) {
      if (!size) {
        return { success: false, error: 'Please select a size for this product' }
      }

      const sizeStock = sizes[size] || 0
      if (sizeStock < quantity) {
        return {
          success: false,
          error: sizeStock > 0
            ? `Only ${sizeStock} available in EU ${size}`
            : `EU ${size} is sold out`
        }
      }

      const updatedSizes = { ...sizes, [size]: sizeStock - quantity }
      if (updatedSizes[size] <= 0) {
        delete updatedSizes[size]
      }

      const newStock = getTotalStockFromSizes(updatedSizes)
      let status = 'Active'
      if (newStock === 0) status = 'Sold'
      else if (newStock <= 2) status = 'Low stock'

      const updated = {
        ...product,
        sizes: Object.keys(updatedSizes).length > 0 ? updatedSizes : null,
        stock: newStock,
        status
      }
      await this.saveProduct(updated)
      return { success: true, product: updated }
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
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('staff').select('*').order('created_at', { ascending: false })
    throwIfError(error, 'Failed to load staff')
    return (data || []).map(mapStaff)
  },

  async getStaffById(id) {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('staff').select('*').eq('id', id).maybeSingle()
    throwIfError(error, 'Failed to load staff')
    return mapStaff(data)
  },

  async getStaffByUserId(userId) {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('staff').select('*').eq('user_id', userId).limit(1).maybeSingle()
    throwIfError(error, 'Failed to load staff')
    return mapStaff(data)
  },

  async saveStaff(staff) {
    const supabase = requireSupabase()
    const row = {
      id: staff.id,
      staff_id: staff.staff_id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      user_id: staff.user_id,
      created_at: staff.created_at || new Date().toISOString()
    }
    const { data, error } = await supabase.from('staff').upsert(row).select('*').single()
    throwIfError(error, 'Failed to save staff')
    return mapStaff(data)
  },

  async deleteStaff(id) {
    const supabase = requireSupabase()
    const { error } = await supabase.from('staff').delete().eq('id', id)
    throwIfError(error, 'Failed to delete staff')
    return true
  },

  async getAllCustomers() {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    throwIfError(error, 'Failed to load customers')
    return (data || []).map(mapCustomer)
  },

  async getCustomerById(id) {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle()
    throwIfError(error, 'Failed to load customer')
    return mapCustomer(data)
  },

  async getCustomerByUserId(userId) {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('customers').select('*').eq('user_id', userId).limit(1).maybeSingle()
    throwIfError(error, 'Failed to load customer')
    return mapCustomer(data)
  },

  async getCustomerByEmail(email) {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .ilike('email', email.trim().toLowerCase())
      .maybeSingle()
    throwIfError(error, 'Failed to load customer')
    return mapCustomer(data)
  },

  async saveCustomer(customer) {
    const supabase = requireSupabase()
    const row = {
      id: customer.id,
      customer_id: customer.customer_id,
      name: customer.name,
      email: customer.email,
      role: customer.role,
      user_id: customer.user_id,
      status: customer.status,
      approved_by: customer.approved_by,
      approved_at: customer.approved_at,
      created_at: customer.created_at || new Date().toISOString()
    }
    const { data, error } = await supabase.from('customers').upsert(row).select('*').single()
    throwIfError(error, 'Failed to save customer')
    return mapCustomer(data)
  },

  async deleteCustomer(id) {
    const supabase = requireSupabase()
    const { error } = await supabase.from('customers').delete().eq('id', id)
    throwIfError(error, 'Failed to delete customer')
    return true
  },

  async getPendingCustomers() {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    throwIfError(error, 'Failed to load pending customers')
    return (data || []).map(mapCustomer)
  },

  async getAllOrders() {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('orders').select(ORDER_SELECT).order('order_date', { ascending: false })
    throwIfError(error, 'Failed to load orders')
    return (data || []).map(mapOrder)
  },

  async getOrdersByCustomerId(customerId) {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('customer_id', customerId)
      .order('order_date', { ascending: false })
    throwIfError(error, 'Failed to load orders')
    return (data || []).map(mapOrder)
  },

  async getOrderById(id) {
    const supabase = requireSupabase()
    const { data, error } = await supabase.from('orders').select(ORDER_SELECT).eq('id', id).maybeSingle()
    throwIfError(error, 'Failed to load order')
    return mapOrder(data)
  },

  async saveOrder(order) {
    const supabase = requireSupabase()
    const row = {
      id: order.id,
      customer_id: order.customer_id,
      product_id: order.product_id,
      product_name: order.product_name,
      quantity: order.quantity,
      unit_price: order.unit_price ?? 0,
      list_unit_price: order.list_unit_price ?? order.unit_price ?? 0,
      discount: order.discount ?? 0,
      total_amount: order.total_amount ?? 0,
      staff_id: order.staff_id || null,
      staff_name: order.staff_name || null,
      payment_method: order.payment_method || 'cash',
      size: order.size || null,
      debtor_name: order.debtor_name || null,
      utang_paid: !!order.utang_paid,
      utang_paid_at: order.utang_paid_at || null,
      utang_paid_method: order.utang_paid_method || null,
      utang_paid_amount: order.utang_paid_amount ?? 0,
      stock_deducted: !!order.stock_deducted,
      order_date: order.order_date || new Date().toISOString()
    }
    const { data, error } = await supabase.from('orders').upsert(row).select(ORDER_SELECT).single()
    throwIfError(error, 'Failed to save order')
    return mapOrder(data)
  },

  async getOrdersSince(sinceIso) {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .gte('order_date', sinceIso)
      .order('order_date', { ascending: false })
    throwIfError(error, 'Failed to load orders')
    return (data || []).map(mapOrder)
  },

  async getOrdersBetween(startIso, endIso) {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .gte('order_date', startIso)
      .lte('order_date', endIso)
      .order('order_date', { ascending: false })
    throwIfError(error, 'Failed to load orders')
    return (data || []).map(mapOrder)
  },

  async deleteOrder(id) {
    const supabase = requireSupabase()
    const { error } = await supabase.from('orders').delete().eq('id', id)
    throwIfError(error, 'Failed to delete order')
    return true
  },

  async enrichOrderWithCustomer(order) {
    if (!order) return null
    if (order.customers !== undefined) return order
    if (!order.customer_id) return { ...order, customers: null }
    const customer = await this.getCustomerById(order.customer_id)
    return {
      ...order,
      customers: customer
        ? { customer_id: customer.customer_id, name: customer.name, email: customer.email }
        : null
    }
  }
}
