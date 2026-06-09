import { localDatabase, generateId } from './localDatabase'

export const categoryService = {
  async getAllCategories() {
    try {
      const data = await localDatabase.getAllCategories()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getCategoryById(id) {
    try {
      const data = await localDatabase.getCategoryById(id)
      return data
        ? { data, error: null }
        : { data: null, error: { message: 'Category not found' } }
    } catch (error) {
      return { data: null, error }
    }
  },

  async createCategory(category) {
    try {
      const data = {
        id: generateId(),
        name: category.name,
        image: category.image || null,
        item_count: category.itemCount || 0,
        created_at: new Date().toISOString()
      }
      await localDatabase.saveCategory(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateCategory(id, updates) {
    try {
      const existing = await localDatabase.getCategoryById(id)
      if (!existing) {
        return { data: null, error: { message: 'Category not found' } }
      }
      const data = { ...existing, ...updates, id }
      await localDatabase.saveCategory(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async deleteCategory(id) {
    try {
      await localDatabase.deleteCategory(id)
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  async updateItemCount(categoryId, count) {
    try {
      const existing = await localDatabase.getCategoryById(categoryId)
      if (!existing) {
        return { data: null, error: { message: 'Category not found' } }
      }
      const data = { ...existing, item_count: count }
      await localDatabase.saveCategory(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async recalculateItemCount(categoryId) {
    try {
      const count = await localDatabase.countProductsByCategory(categoryId)
      return this.updateItemCount(categoryId, count)
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async recalculateAllItemCounts() {
    try {
      const categories = await localDatabase.getAllCategories()
      for (const category of categories) {
        const count = await localDatabase.countProductsByCategory(category.id)
        await localDatabase.saveCategory({ ...category, item_count: count })
      }
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err }
    }
  }
}
