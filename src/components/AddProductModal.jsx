import { useState, useEffect, useRef, useCallback } from 'react'
import ImageUploadField from './ImageUploadField'
import BarcodeScanner from './BarcodeScanner'
import { lookupProductByBarcode } from '../utils/barcodeLookup'

function AddProductModal({ isOpen, onClose, onAddProduct, editingProduct, categories = [], products = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    price: '',
    category: '',
    image: '',
    barcode: ''
  })
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanMessage, setScanMessage] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [matchedProductId, setMatchedProductId] = useState(null)
  const stockInputRef = useRef(null)

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        stock: editingProduct.stock || '',
        price: editingProduct.price || '',
        category: editingProduct.category_name || editingProduct.category || '',
        image: editingProduct.image || '',
        barcode: editingProduct.barcode || ''
      })
    } else {
      setFormData({
        name: '',
        stock: '',
        price: '',
        category: '',
        image: '',
        barcode: ''
      })
    }
    setScanMessage('')
    setScannerOpen(false)
    setMatchedProductId(null)
  }, [editingProduct, isOpen])

  const categoryNames = categories.map((cat) => cat.name)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageChange = (image) => {
    setFormData((prev) => ({ ...prev, image }))
  }

  const handleBarcodeScan = useCallback(async (barcode) => {
    setScannerOpen(false)
    setLookingUp(true)
    setScanMessage('Looking up product...')

    try {
      const result = await lookupProductByBarcode(barcode, products)

      if (result.product) {
        const product = result.product
        setFormData({
          name: product.name || '',
          stock: product.stock ?? '',
          price: product.price ?? '',
          category: product.category_name || product.category || '',
          image: product.image || '',
          barcode: result.barcode
        })
        setMatchedProductId(product.id)
        setScanMessage(
          `Existing product found. Name, price, quantity, category, and image filled automatically.`
        )
      } else if (result.name) {
        setMatchedProductId(null)
        setFormData((prev) => ({
          ...prev,
          name: result.name,
          barcode: result.barcode
        }))
        setScanMessage(`New product: ${result.name}. Enter quantity, price, and category.`)
      } else {
        setMatchedProductId(null)
        setFormData((prev) => ({
          ...prev,
          name: '',
          barcode: result.barcode
        }))
        setScanMessage(
          `Barcode scanned (${result.barcode}). Enter the product details manually below.`
        )
      }

      setTimeout(() => stockInputRef.current?.focus(), 100)
    } catch (err) {
      console.error('Barcode lookup failed:', err)
      setScanMessage('Scan failed. Try again or enter the product details manually.')
    } finally {
      setLookingUp(false)
    }
  }, [products])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.name && formData.stock && formData.category) {
      onAddProduct({
        ...formData,
        stock: parseInt(formData.stock, 10),
        price: parseFloat(formData.price) || 0,
        image: formData.image || '',
        barcode: formData.barcode || null,
        existingProductId: matchedProductId || editingProduct?.id || null
      })
      setFormData({
        name: '',
        stock: '',
        price: '',
        category: '',
        image: '',
        barcode: ''
      })
      setScanMessage('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {editingProduct || matchedProductId ? 'Edit Product' : 'Add Product'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            <div className="space-y-4">
              {!editingProduct && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-3">
                   
                  </p>
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    disabled={lookingUp}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-[#357abd] transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {lookingUp ? 'Looking up...' : 'Scan Barcode'}
                  </button>
                  {scanMessage && (
                    <p className="text-sm text-blue-800 mt-3">{scanMessage}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Scan barcode or enter product name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  required
                />
                {formData.barcode && (
                  <p className="text-xs text-gray-500 mt-1">Barcode: {formData.barcode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock/Items *</label>
                <input
                  ref={stockInputRef}
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="Enter stock quantity"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Enter price (e.g., 99.99)"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  required
                >
                  <option value="">Select a category</option>
                  {categoryNames.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <ImageUploadField label="Product Image" value={formData.image} onChange={handleImageChange} />
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
                {editingProduct || matchedProductId ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default AddProductModal
