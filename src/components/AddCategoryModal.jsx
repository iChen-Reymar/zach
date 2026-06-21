import { useState, useEffect } from 'react'
import ImageUploadField from './ImageUploadField'

function AddCategoryModal({ isOpen, onClose, onAddCategory, editingCategory }) {
  const [formData, setFormData] = useState({
    name: '',
    image: ''
  })

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name || '',
        image: editingCategory.image || ''
      })
    } else {
      setFormData({
        name: '',
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
    if (formData.name) {
      onAddCategory({
        name: formData.name,
        image: formData.image || '',
        itemCount: editingCategory
          ? (editingCategory.item_count || editingCategory.itemCount || 0)
          : 0
      })
      setFormData({
        name: '',
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

            <ImageUploadField label="Category Image" value={formData.image} onChange={handleImageChange} />
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
