import { useState, useEffect, useRef, useCallback } from 'react'
import ImageUploadField from './ImageUploadField'
import BarcodeScanner from './BarcodeScanner'
import { lookupProductByBarcode } from '../utils/barcodeLookup'
import {
  SHOE_SIZES,
  createEmptySizeStock,
  getTotalStockFromSizes,
  normalizeSizes,
  sizesToFormState
} from '../utils/shoeSizes'

function AddProductModal({
  isOpen,
  onClose,
  onAddProduct,
  editingProduct,
  categories = [],
  products = [],
  isAdmin = false
}) {
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    price: '',
    category: '',
    image: '',
    barcode: ''
  })
  const [sizeStock, setSizeStock] = useState(createEmptySizeStock())
  const [legacyStock, setLegacyStock] = useState('')
  const [useLegacyStock, setUseLegacyStock] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanMessage, setScanMessage] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [matchedProductId, setMatchedProductId] = useState(null)
  const nameInputRef = useRef(null)

  const totalStock = useLegacyStock
    ? parseInt(legacyStock, 10) || 0
    : getTotalStockFromSizes(sizeStock)

  useEffect(() => {
    if (editingProduct) {
      const hasSizes = editingProduct.sizes && Object.keys(normalizeSizes(editingProduct.sizes)).length > 0
      setFormData({
        name: editingProduct.name || '',
        cost: editingProduct.cost ?? '',
        price: editingProduct.price ?? '',
        category: editingProduct.category_name || editingProduct.category || '',
        image: editingProduct.image || '',
        barcode: editingProduct.barcode || ''
      })
      setSizeStock(sizesToFormState(editingProduct.sizes))
      setUseLegacyStock(!hasSizes)
      setLegacyStock(!hasSizes ? String(editingProduct.stock ?? '') : '')
    } else {
      setFormData({
        name: '',
        cost: '',
        price: '',
        category: '',
        image: '',
        barcode: ''
      })
      setSizeStock(createEmptySizeStock())
      setUseLegacyStock(false)
      setLegacyStock('')
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

  const handleSizeChange = (size, value) => {
    if (value !== '' && (parseInt(value, 10) < 0 || Number.isNaN(parseInt(value, 10)))) return
    setSizeStock((prev) => ({ ...prev, [size]: value }))
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
          cost: isAdmin ? (product.cost ?? '') : '',
          price: product.price ?? '',
          category: product.category_name || product.category || '',
          image: product.image || '',
          barcode: result.barcode
        })
        setSizeStock(sizesToFormState(product.sizes))
        setUseLegacyStock(false)
        setLegacyStock('')
        setMatchedProductId(product.id)
        setScanMessage(
          'Existing product found. Name, price, sizes, category, and image filled automatically.'
        )
      } else if (result.name) {
        setMatchedProductId(null)
        setFormData((prev) => ({
          ...prev,
          name: result.name,
          barcode: result.barcode
        }))
        setSizeStock(createEmptySizeStock())
        setUseLegacyStock(false)
        setLegacyStock('')
        setScanMessage(`New product: ${result.name}. Enter sizes, price, and category.`)
      } else {
        setMatchedProductId(null)
        setFormData((prev) => ({
          ...prev,
          name: '',
          barcode: result.barcode
        }))
        setSizeStock(createEmptySizeStock())
        setUseLegacyStock(false)
        setLegacyStock('')
        setScanMessage(
          `Barcode scanned (${result.barcode}). Enter the product details manually below.`
        )
      }

      setTimeout(() => nameInputRef.current?.focus(), 100)
    } catch (err) {
      console.error('Barcode lookup failed:', err)
      setScanMessage('Scan failed. Try again or enter the product details manually.')
    } finally {
      setLookingUp(false)
    }
  }, [products, isAdmin])

  const handleSubmit = (e) => {
    e.preventDefault()
    const sizes = useLegacyStock ? {} : normalizeSizes(sizeStock)
    if (formData.name && totalStock > 0 && formData.category) {
      const productData = {
        ...formData,
        stock: totalStock,
        sizes: Object.keys(sizes).length > 0 ? sizes : null,
        price: parseFloat(formData.price) || 0,
        image: formData.image || '',
        barcode: formData.barcode || null,
        existingProductId: matchedProductId || editingProduct?.id || null
      }

      if (isAdmin) {
        productData.cost = parseFloat(formData.cost) || 0
      }

      onAddProduct(productData)
      setFormData({
        name: '',
        cost: '',
        price: '',
        category: '',
        image: '',
        barcode: ''
      })
      setSizeStock(createEmptySizeStock())
      setUseLegacyStock(false)
      setLegacyStock('')
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

      <div className="ui-modal-shell">
        <div className="ui-modal-panel max-w-2xl">
          <div className="ui-modal-header">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {editingProduct || matchedProductId ? 'Edit Product' : 'Add Product'}
            </h2>
            <button onClick={onClose} className="ui-touch text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="ui-modal-body">
            <div className="space-y-3">
              {!editingProduct && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
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
                  ref={nameInputRef}
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">EU Shoe Sizes *</label>
                  <span className="text-sm text-gray-600">
                    Total: <span className="font-semibold text-gray-900">{totalStock}</span> pairs
                  </span>
                </div>
                {useLegacyStock ? (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">
                      This product has total stock only. Enter per-size quantities below to track sizes, or update total stock.
                    </p>
                    <input
                      type="number"
                      value={legacyStock}
                      onChange={(e) => setLegacyStock(e.target.value)}
                      placeholder="Enter total stock"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue mb-3"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUseLegacyStock(false)
                        setLegacyStock('')
                      }}
                      className="text-sm text-primary-blue hover:underline"
                    >
                      Switch to per-size stock
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-4">
                      Tap a size and enter how many pairs you have in stock.
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {SHOE_SIZES.map((size) => {
                        const qty = sizeStock[size]
                        const hasStock = parseInt(qty, 10) > 0
                        return (
                          <div key={size} className="flex flex-col items-center">
                            <div
                              className={`w-full min-h-[40px] flex items-center justify-center rounded-md text-lg font-semibold transition-colors ${
                                hasStock
                                  ? 'bg-white border border-primary-blue text-gray-900'
                                  : 'bg-gray-100 border border-transparent text-gray-600'
                              }`}
                            >
                              {size}
                            </div>
                            <input
                              type="number"
                              value={qty}
                              onChange={(e) => handleSizeChange(size, e.target.value)}
                              placeholder="0"
                              min="0"
                              aria-label={`EU size ${size} quantity`}
                              className="mt-1.5 w-full px-2 py-1.5 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:border-primary-blue"
                            />
                          </div>
                        )
                      })}
                    </div>
                    {totalStock === 0 && (
                      <p className="text-sm text-amber-600 mt-3">Add stock for at least one EU size.</p>
                    )}
                  </>
                )}
              </div>

              <div className={isAdmin ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleChange}
                      placeholder="Enter cost (e.g., 50.00)"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                    />
                    <p className="text-xs text-gray-500 mt-1">Only visible to admin.</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Enter selling price (e.g., 99.99)"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                    required
                  />
                </div>
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
                className="ui-btn text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={totalStock === 0}
                className="ui-btn bg-primary-blue text-white hover:bg-[#357abd] disabled:opacity-50 disabled:cursor-not-allowed"
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
