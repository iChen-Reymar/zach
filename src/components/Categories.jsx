import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import AddCategoryModal from './AddCategoryModal'
import { useAuth } from '../contexts/AuthContext'
import { categoryService } from '../services/categoryService'
import { assetPath } from '../utils/assetPath'

function Categories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isAdmin, isStaff } = useAuth()

  // Fetch categories from database
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      // Fetch categories first
      const { data, error } = await categoryService.getAllCategories()
      if (error) throw error
      
      if (data && data.length > 0) {
        await categoryService.recalculateAllItemCounts()
        const { data: refreshed } = await categoryService.getAllCategories()
        setCategories(refreshed || data)
      } else {
        setCategories(data || [])
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }
  // Get current date and time for "Last update"
  const getLastUpdate = () => {
    const now = new Date()
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December']
    const month = months[now.getMonth()]
    const day = now.getDate()
    const year = now.getFullYear()
    let hours = now.getHours()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    return `Last update ${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`
  }

  const getDefaultImage = (categoryName) => {
    const categoryImages = {
      'Base Guitar': assetPath('images/Fender-P-Bass-electric-guitar.webp'),
      'Acoustic Guitar': assetPath('images/cac23fb4865901db2c1ba83534e45ee1.jpg_720x720q80.jpg'),
      'Piano Keyboard': assetPath('images/products_2FF03-097-1910-032_2FF03-097-1910-032_1719213023050_1200x1200 (1).webp'),
      'Electric Guitar': assetPath('images/V6MRLB.webp'),
      'Drum': assetPath('images/drum-kit-standard.eb6cdcf0e2d2b6c360fb.png')
    }
    return categoryImages[categoryName] || assetPath('images/Fender-P-Bass-electric-guitar.webp')
  }

  const handleAddCategory = async (newCategory) => {
    try {
      const { error } = await categoryService.createCategory({
        name: newCategory.name,
        itemCount: newCategory.itemCount,
        image: newCategory.image || getDefaultImage(newCategory.name)
      })
      
      if (error) throw error
      await fetchCategories()
    } catch (err) {
      console.error('Error adding category:', err)
      alert('Failed to add category. Please try again.')
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleUpdateCategory = async (updatedCategory) => {
    try {
      const { error } = await categoryService.updateCategory(editingCategory.id, {
        name: updatedCategory.name,
        image: updatedCategory.image || getDefaultImage(updatedCategory.name)
      })
      
      if (error) throw error
      setEditingCategory(null)
      await fetchCategories()
    } catch (err) {
      console.error('Error updating category:', err)
      alert('Failed to update category. Please try again.')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      const { error } = await categoryService.deleteCategory(categoryId)
      if (error) throw error
      await fetchCategories()
    } catch (err) {
      console.error('Error deleting category:', err)
      alert('Failed to delete category. Please try again.')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  const handleCategorySubmit = (categoryData) => {
    if (editingCategory) {
      handleUpdateCategory(categoryData)
    } else {
      handleAddCategory(categoryData)
    }
    handleModalClose()
  }

  return (
    <Layout pageTitle="categories">
      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onAddCategory={handleCategorySubmit}
        editingCategory={editingCategory}
      />
      <div className="p-4 sm:p-6">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Categories</h1>
            <p className="text-sm text-gray-500">{getLastUpdate()}</p>
          </div>
          {(isAdmin() || isStaff()) && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-[#357abd] transition-colors"
            >
              + Add Categories
            </button>
          )}
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No categories found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* Category Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                      src={category.image || getDefaultImage(category.name)}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/64x64?text=${category.name.charAt(0)}`
                      }}
                    />
                  </div>

                  {/* Category Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category.item_count || category.itemCount || 0} items
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(isAdmin() || isStaff()) && (
                      <>
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        {isAdmin() && (
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4 text-red-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                    {/* Arrow button - View products in this category (visible to all users) */}
                    <button 
                      onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      title={`View products in ${category.name}`}
                    >
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Categories

