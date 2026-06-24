import { supabaseDatabase, generateId } from './supabaseDatabase'
import { categoryService } from './categoryService'
import { getTotalStockFromSizes, normalizeSizes } from '../utils/shoeSizes'

function getProductStatus(stock) {
  if (stock === 0) return 'Sold'
  if (stock <= 2) return 'Low stock'
  return 'Active'
}

export const productService = {
  async getAllProducts() {
    try {
      const data = await supabaseDatabase.getAllProducts()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getProductById(id) {
    try {
      const data = await supabaseDatabase.getProductById(id)
      return data
        ? { data, error: null }
        : { data: null, error: { message: 'Product not found' } }
    } catch (error) {
      return { data: null, error }
    }
  },

  async createProduct(product) {
    try {
      const sizes = normalizeSizes(product.sizes)
      const stock = Object.keys(sizes).length > 0
        ? getTotalStockFromSizes(sizes)
        : product.stock

      const data = {
        id: generateId(),
        name: product.name,
        stock,
        price: product.price || 0,
        cost: product.cost || 0,
        status: getProductStatus(stock),
        category_id: product.category_id,
        category_name: product.category_name,
        image: product.image || null,
        barcode: product.barcode || null,
        sizes: Object.keys(sizes).length > 0 ? sizes : null,
        created_at: new Date().toISOString()
      }

      await supabaseDatabase.saveProduct(data)

      if (product.category_id) {
        const count = await supabaseDatabase.countProductsByCategory(product.category_id)
        await categoryService.updateItemCount(product.category_id, count)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateProduct(id, updates) {
    try {
      const currentProduct = await supabaseDatabase.getProductById(id)
      if (!currentProduct) {
        return { data: null, error: { message: 'Product not found' } }
      }

      const oldCategoryId = currentProduct.category_id
      const sizes = updates.sizes !== undefined
        ? normalizeSizes(updates.sizes)
        : normalizeSizes(currentProduct.sizes)
      const stock = Object.keys(sizes).length > 0
        ? getTotalStockFromSizes(sizes)
        : (updates.stock !== undefined ? updates.stock : currentProduct.stock)

      const merged = {
        ...currentProduct,
        ...updates,
        id,
        stock,
        sizes: Object.keys(sizes).length > 0 ? sizes : null
      }

      if (updates.stock !== undefined || updates.sizes !== undefined) {
        merged.status = getProductStatus(stock)
      }

      await supabaseDatabase.saveProduct(merged)

      if (updates.category_id && oldCategoryId !== updates.category_id) {
        if (oldCategoryId) {
          const oldCount = await supabaseDatabase.countProductsByCategory(oldCategoryId)
          await categoryService.updateItemCount(oldCategoryId, oldCount)
        }
        const newCount = await supabaseDatabase.countProductsByCategory(updates.category_id)
        await categoryService.updateItemCount(updates.category_id, newCount)
      }

      return { data: merged, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async deleteProduct(id) {
    try {
      const product = await supabaseDatabase.getProductById(id)
      if (!product) {
        return { error: { message: 'Product not found' } }
      }

      await supabaseDatabase.deleteProduct(id)

      if (product.category_id) {
        const count = await supabaseDatabase.countProductsByCategory(product.category_id)
        await categoryService.updateItemCount(product.category_id, count)
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }
}
