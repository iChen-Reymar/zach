import { useState, useEffect } from 'react'
import ExistingImagePicker from './ExistingImagePicker'
import ImageUploadField from './ImageUploadField'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'

function AddCategoryModal({ isOpen, onClose, onAddCategory, editingCategory }) {
  const [formData, setFormData] = useState({
    name: '',
    itemCount: '',
    image: ''
  })
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingImages, setLoadingImages] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const fetchImageSources = async () => {
      setLoadingImages(true)
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          productService.getAllProducts(),
          categoryService.getAllCategories()
        ])
        setProducts(productsResult.data || [])
        setCategories(categoriesResult.data || [])
      } catch (err) {
        console.error('Error loading images:', err)
        setProducts([])
        setCategories([])
      } finally {
        setLoadingImages(false)
      }
    }

    fetchImageSources()
  }, [isOpen])

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name || '',
        itemCount: editingCategory.item_count || editingCategory.itemCount || '',
        image: editingCategory.image || ''
      })
    } else {
      setFormData({
        name: '',
        itemCount: '',
        image: ''
      })
    }
  }, [editingCategory, isOpen])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageChange = (image) => {
    setFormData((prev) => ({ ...prev, image }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.name && formData.itemCount) {
      onAddCategory({
        ...formData,
        itemCount: parseInt(formData.itemCount, 10),
        image: formData.image || ''
      })
      setFormData({
        name: '',
        itemCount: '',
        image: ''
      })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter category name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Count *</label>
              <input
                type="number"
                name="itemCount"
                value={formData.itemCount}
                onChange={handleChange}
                placeholder="Enter number of items"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                required
              />
            </div>

            <ImageUploadField label="Category Image" value={formData.image} onChange={handleImageChange}>
              {loadingImages ? (
                <p className="text-xs text-gray-400">Loading existing images...</p>
              ) : (
                <ExistingImagePicker
                  sections={[
                    { label: 'Or select from existing categories:', items: categories },
                    { label: 'Or select from existing products:', items: products }
                  ]}
                  selectedImage={formData.image}
                  onSelect={handleImageChange}
                />
              )}
            </ImageUploadField>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-[#357abd] transition-colors"
            >
              {editingCategory ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCategoryModal
