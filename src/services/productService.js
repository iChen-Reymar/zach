import { localDatabase, generateId } from './localDatabase'
import { categoryService } from './categoryService'

function getProductStatus(stock) {
  if (stock === 0) return 'Sold'
  if (stock <= 2) return 'Low stock'
  return 'Active'
}

export const productService = {
  async getAllProducts() {
    try {
      const data = await localDatabase.getAllProducts()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getProductById(id) {
    try {
      const data = await localDatabase.getProductById(id)
      return data
        ? { data, error: null }
        : { data: null, error: { message: 'Product not found' } }
    } catch (error) {
      return { data: null, error }
    }
  },

  async createProduct(product) {
    try {
      let image = product.image
      if (product.category_id && !image) {
        const category = await localDatabase.getCategoryById(product.category_id)
        if (category) image = category.image
      }

      const data = {
        id: generateId(),
        name: product.name,
        stock: product.stock,
        price: product.price || 0,
        status: getProductStatus(product.stock),
        category_id: product.category_id,
        category_name: product.category_name,
        image: image || null,
        barcode: product.barcode || null,
        created_at: new Date().toISOString()
      }

      await localDatabase.saveProduct(data)

      if (product.category_id) {
        const count = await localDatabase.countProductsByCategory(product.category_id)
        await categoryService.updateItemCount(product.category_id, count)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateProduct(id, updates) {
    try {
      const currentProduct = await localDatabase.getProductById(id)
      if (!currentProduct) {
        return { data: null, error: { message: 'Product not found' } }
      }

      const oldCategoryId = currentProduct.category_id
      const merged = { ...currentProduct, ...updates, id }

      if (updates.stock !== undefined) {
        merged.status = getProductStatus(updates.stock)
      }

      await localDatabase.saveProduct(merged)

      if (updates.category_id && oldCategoryId !== updates.category_id) {
        if (oldCategoryId) {
          const oldCount = await localDatabase.countProductsByCategory(oldCategoryId)
          await categoryService.updateItemCount(oldCategoryId, oldCount)
        }
        const newCount = await localDatabase.countProductsByCategory(updates.category_id)
        await categoryService.updateItemCount(updates.category_id, newCount)
      }

      return { data: merged, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async deleteProduct(id) {
    try {
      const product = await localDatabase.getProductById(id)
      if (!product) {
        return { error: { message: 'Product not found' } }
      }

      await localDatabase.deleteProduct(id)

      if (product.category_id) {
        const count = await localDatabase.countProductsByCategory(product.category_id)
        await categoryService.updateItemCount(product.category_id, count)
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }
}
