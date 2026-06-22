import { useState, useEffect, useMemo, useRef } from 'react'
import { productService } from '../services/productService'
import { orderService } from '../services/orderService'
import { useAuth } from '../contexts/AuthContext'
import { normalizeSizes, sortSizeEntries, formatSizeLabel } from '../utils/shoeSizes'
import { isUtangPayment } from '../utils/paymentMethod'

function SaleModal({ isOpen, onClose, onSaleComplete }) {
  const { user, profile } = useAuth()
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showProductList, setShowProductList] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [saleUnitPrice, setSaleUnitPrice] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [debtorName, setDebtorName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const productSearchRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      setError('')
      setSuccess('')
      setProductSearch('')
      setSelectedSize('')
      setShowProductList(false)
      setSaleUnitPrice('')
      setDiscountAmount('')
      setDebtorName('')
      setPaymentMethod('cash')
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productSearchRef.current && !productSearchRef.current.contains(event.target)) {
        setShowProductList(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error: fetchError } = await productService.getAllProducts()
      if (fetchError) throw fetchError
      setProducts((data || []).filter((p) => p.stock > 0))
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Failed to load products')
    }
  }

  const filteredProducts = useMemo(() => {
    const query = productSearch.toLowerCase().trim()
    if (!query) return products

    return products.filter((product) => {
      const name = (product.name || '').toLowerCase()
      const category = (product.category_name || product.category || '').toLowerCase()
      const barcode = (product.barcode || '').toLowerCase()
      const stock = product.stock?.toString() || ''

      return (
        name.includes(query) ||
        category.includes(query) ||
        barcode.includes(query) ||
        stock.includes(query)
      )
    })
  }, [products, productSearch])

  const selectedProductData = products.find((p) => p.id === selectedProduct)
  const availableSizes = useMemo(() => {
    if (!selectedProductData) return []
    return sortSizeEntries(selectedProductData.sizes)
  }, [selectedProductData])
  const productHasSizes = availableSizes.length > 0
  const selectedSizeStock = productHasSizes
    ? (normalizeSizes(selectedProductData?.sizes)[selectedSize] || 0)
    : (selectedProductData?.stock || 0)
  const listUnitPrice = parseFloat(selectedProductData?.price || 0)
  const parsedSaleUnitPrice = parseFloat(saleUnitPrice)
  const parsedQuantity = parseInt(quantity || 1, 10)
  const parsedDiscount = parseFloat(discountAmount || 0)
  const unitPrice = Number.isFinite(parsedSaleUnitPrice) ? parsedSaleUnitPrice : listUnitPrice
  const totalAmount = Math.max(0, unitPrice * parsedQuantity).toFixed(2)
  const maxDiscount = listUnitPrice * parsedQuantity

  const handleSelectProduct = (product) => {
    setSelectedProduct(product.id)
    setSelectedSize('')
    setProductSearch(product.name)
    setSaleUnitPrice(String(parseFloat(product.price || 0)))
    setDiscountAmount('0')
    setQuantity(1)
    setShowProductList(false)
    setError('')
  }

  const handleSelectSize = (size) => {
    setSelectedSize(size)
    setQuantity(1)
    setError('')
  }

  const handleClearProduct = () => {
    setSelectedProduct('')
    setSelectedSize('')
    setProductSearch('')
    setSaleUnitPrice('')
    setDiscountAmount('')
    setShowProductList(false)
  }

  const handleSaleUnitPriceChange = (value) => {
    setSaleUnitPrice(value)
    const salePrice = parseFloat(value)
    if (!selectedProductData || !Number.isFinite(salePrice)) return
    const qty = parseInt(quantity || 1, 10)
    const discount = Math.max(0, (listUnitPrice - salePrice) * qty)
    setDiscountAmount(discount > 0 ? discount.toFixed(2) : '0')
  }

  const handleDiscountChange = (value) => {
    setDiscountAmount(value)
    const discount = parseFloat(value)
    if (!selectedProductData || !Number.isFinite(discount)) return
    const qty = parseInt(quantity || 1, 10)
    const perUnitDiscount = discount / qty
    const salePrice = Math.max(0, listUnitPrice - perUnitDiscount)
    setSaleUnitPrice(salePrice.toFixed(2))
  }

  const handleQuantityChange = (value) => {
    setQuantity(value)
    const qty = parseInt(value || 1, 10)
    const salePrice = parseFloat(saleUnitPrice)
    if (!selectedProductData || !Number.isFinite(salePrice) || qty < 1) return
    const discount = Math.max(0, (listUnitPrice - salePrice) * qty)
    setDiscountAmount(discount > 0 ? discount.toFixed(2) : '0')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedProduct || !quantity || quantity < 1) {
      setError('Select a product and enter a valid quantity')
      return
    }

    if (!selectedProductData) {
      setError('Product not found')
      return
    }

    if (productHasSizes && !selectedSize) {
      setError('Please select a size for the buyer')
      return
    }

    if (quantity > selectedSizeStock) {
      setError(
        productHasSizes
          ? `Only ${selectedSizeStock} available in EU ${selectedSize}`
          : `Only ${selectedSizeStock} items available`
      )
      return
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setError('Enter a valid sale price')
      return
    }

    if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
      setError('Enter a valid discount amount')
      return
    }

    if (parsedDiscount > maxDiscount) {
      setError(`Discount cannot exceed ₱${maxDiscount.toFixed(2)}`)
      return
    }

    if (isUtangPayment(paymentMethod) && !debtorName.trim()) {
      setError('Enter the name of the person who has utang')
      return
    }

    setLoading(true)
    try {
      const { error: orderError } = await orderService.createOrder({
        product_id: selectedProductData.id,
        product_name: selectedProductData.name,
        quantity: parsedQuantity,
        unit_price: unitPrice,
        list_unit_price: listUnitPrice,
        discount: parsedDiscount,
        total_amount: parseFloat(totalAmount),
        staff_id: user?.id,
        staff_name: profile?.name || user?.email || 'Staff',
        payment_method: paymentMethod,
        size: productHasSizes ? selectedSize : null,
        debtor_name: isUtangPayment(paymentMethod) ? debtorName.trim() : null
      })

      if (orderError) throw new Error(orderError.message || 'Sale failed')

      const sizeLabel = productHasSizes ? ` · EU ${selectedSize}` : ''
      const utangLabel = isUtangPayment(paymentMethod) ? ` · Utang: ${debtorName.trim()}` : ''
      setSuccess(
        `Sale recorded! Total: ₱${totalAmount}${sizeLabel}${utangLabel}${parsedDiscount > 0 ? ` (Discount: ₱${parsedDiscount.toFixed(2)})` : ''}`
      )
      if (onSaleComplete) await onSaleComplete()

      setSelectedProduct('')
      setSelectedSize('')
      setProductSearch('')
      setSaleUnitPrice('')
      setDiscountAmount('')
      setQuantity(1)
      setPaymentMethod('cash')
      setDebtorName('')

      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 1500)
    } catch (err) {
      console.error('Sale error:', err)
      setError(err.message || 'Failed to record sale')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Record Sale</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-4">
          <p className="text-sm text-gray-600">
            {isUtangPayment(paymentMethod)
              ? 'Utang recorded. Stock will deduct when the debt is fully paid.'
              : 'Stock will be deducted automatically and added to sales statistics.'}
          </p>

          <div ref={productSearchRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
            <div className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value)
                  setSelectedProduct('')
                  setShowProductList(true)
                }}
                onFocus={() => setShowProductList(true)}
                placeholder="Search shoes by name, category, or barcode..."
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                autoComplete="off"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={handleClearProduct}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {showProductList && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                {products.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">No products in stock</p>
                ) : filteredProducts.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    No shoes found matching &quot;{productSearch}&quot;
                  </p>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                        selectedProduct === product.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        ₱{parseFloat(product.price || 0).toFixed(2)} · Stock: {product.stock}
                        {product.category_name || product.category
                          ? ` · ${product.category_name || product.category}`
                          : ''}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedProductData && !showProductList && (
              <p className="mt-2 text-xs text-green-700">
                Selected: {selectedProductData.name} (List: ₱{listUnitPrice.toFixed(2)}, Stock: {selectedProductData.stock}
                {productHasSizes && selectedSize ? ` · EU ${selectedSize}: ${selectedSizeStock}` : ''})
              </p>
            )}
          </div>

          {selectedProductData && productHasSizes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size (EU) *</label>
              <p className="text-xs text-gray-500 mb-2">Only available sizes are shown. Sold-out sizes are hidden.</p>
              <div className="grid grid-cols-4 gap-2">
                {availableSizes.map(([size, qty]) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSelectSize(size)}
                    className={`flex flex-col items-center rounded-lg border p-2 transition-colors ${
                      selectedSize === size
                        ? 'border-primary-blue bg-blue-50 ring-2 ring-primary-blue'
                        : 'border-gray-200 bg-white hover:border-primary-blue hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-base font-bold text-gray-900">{size}</span>
                    <span className="text-[10px] text-gray-500">{formatSizeLabel(size)}</span>
                    <span className="text-xs font-semibold text-primary-blue mt-1">{qty} left</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
            <input
              type="number"
              min="1"
              max={selectedProductData ? Math.max(1, selectedSizeStock) : undefined}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              disabled={productHasSizes && !selectedSize}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue disabled:bg-gray-100 disabled:text-gray-400"
              required
            />
            {productHasSizes && !selectedSize && (
              <p className="text-xs text-gray-500 mt-1">Select a size first</p>
            )}
          </div>

          {selectedProductData && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sale Price (per unit) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={saleUnitPrice}
                  onChange={(e) => handleSaleUnitPriceChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Original price: ₱{listUnitPrice.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount (total)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={maxDiscount}
                  value={discountAmount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter discount for buyer negotiation. Max: ₱{maxDiscount.toFixed(2)}
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment</label>
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value)
                if (!isUtangPayment(e.target.value)) {
                  setDebtorName('')
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
            >
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="card">Card</option>
              <option value="utang">Utang</option>
            </select>
          </div>

          {isUtangPayment(paymentMethod) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name (Utang) *</label>
              <input
                type="text"
                value={debtorName}
                onChange={(e) => setDebtorName(e.target.value)}
                placeholder="Enter name of person who owes"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                required
              />
              <p className="text-xs text-amber-700 mt-1">
                This sale will be recorded as utang. Inventory updates when fully paid.
              </p>
            </div>
          )}

          {selectedProductData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">List price</span>
                <span className="font-medium">₱{listUnitPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Sale price</span>
                <span className="font-medium">₱{unitPrice.toFixed(2)}</span>
              </div>
              {parsedDiscount > 0 && (
                <div className="flex justify-between mt-1 text-amber-700">
                  <span>Discount</span>
                  <span className="font-medium">-₱{parsedDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Total</span>
                <span className="font-bold text-primary-blue text-lg">₱{totalAmount}</span>
              </div>
              <div className="flex justify-between mt-1 text-gray-500">
                <span>{isUtangPayment(paymentMethod) ? 'Stock after full payment' : 'Stock after sale'}</span>
                <span>
                  {isUtangPayment(paymentMethod)
                    ? `${selectedProductData.stock} (unchanged until paid)`
                    : productHasSizes && selectedSize
                      ? `EU ${selectedSize}: ${Math.max(0, selectedSizeStock - parsedQuantity)} · Total: ${Math.max(0, selectedProductData.stock - parsedQuantity)}`
                      : Math.max(0, selectedProductData.stock - parsedQuantity)}
                </span>
              </div>
            </div>
          )}

          {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
          {success && <div className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3">{success}</div>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedProduct || (productHasSizes && !selectedSize) || (isUtangPayment(paymentMethod) && !debtorName.trim())}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SaleModal
