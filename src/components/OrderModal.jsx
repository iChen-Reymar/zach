import { useState, useEffect } from 'react'
import { productService } from '../services/productService'
import { orderService } from '../services/orderService'
import { authService } from '../services/authService'
import { customerService } from '../services/customerService'
import { useAuth } from '../contexts/AuthContext'

function OrderModal({ isOpen, onClose, onOrderPlaced, user }) {
  const { profile } = useAuth()
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('balance') // 'balance', 'gcash', 'credit_card'
  const [gcashNumber, setGcashNumber] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [userBalance, setUserBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [customer, setCustomer] = useState(null)

  // Fetch products, customer data, and user balance
  useEffect(() => {
    if (isOpen && user) {
      console.log('🔄 OrderModal opened, fetching data for user:', user.id, user.email)
      fetchProducts()
      fetchCustomer()
      fetchUserBalance()
    }
    // Reset customer state when modal closes
    if (!isOpen) {
      setCustomer(null)
      setError('')
    }
  }, [isOpen, user, profile])
  
  // Re-fetch customer if not found (retry mechanism)
  useEffect(() => {
    if (isOpen && user && !customer && !loading) {
      console.log('⚠️ Customer not set after initial fetch, retrying in 1 second...')
      const retryTimer = setTimeout(() => {
        fetchCustomer()
      }, 1000)
      return () => clearTimeout(retryTimer)
    }
  }, [isOpen, user, customer, loading])

  const fetchProducts = async () => {
    try {
      const { data, error } = await productService.getAllProducts()
      if (error) throw error
      // Filter only active products with stock > 0
      const availableProducts = (data || []).filter(
        p => p.status === 'Active' && p.stock > 0
      )
      setProducts(availableProducts)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Failed to load products')
    }
  }

  const fetchCustomer = async () => {
    if (!user?.id) return

    try {
      setError('')
      let data = null

      const byUserId = await customerService.getCustomerByUserId(user.id)
      if (byUserId.data) {
        data = byUserId.data
      }

      if (!data && user.email) {
        const byEmail = await customerService.searchCustomerByEmail(user.email)
        if (byEmail.data) {
          data = byEmail.data
          if (!data.user_id || data.user_id !== user.id) {
            const { data: updated } = await customerService.updateCustomer(data.id, {
              user_id: user.id
            })
            if (updated) data = updated
          }
        }
      }

      if (!data) {
        setCustomer(null)
        setError('Customer record not found. Please contact an admin to set up your customer account.')
        return
      }
      
      // Check if customer is approved (case-insensitive, handle various formats)
      const statusRaw = (data.status || '').toString()
      const status = statusRaw.toLowerCase().trim()
      console.log('Customer status check:', {
        raw: statusRaw,
        normalized: status,
        customerData: data
      })
      
      // Accept various approved status formats
      const isApproved = status === 'approved' || status === 'approve' || statusRaw.toUpperCase() === 'APPROVED'
      
      if (isApproved) {
        console.log('✅ Customer is approved, setting customer data')
        // Ensure we have the customer ID for order creation
        if (!data.id && data.customer_id) {
          console.warn('Customer data missing id field, using customer_id')
        }
        setCustomer(data)
        setError('') // Clear any errors
        console.log('Customer state set:', data)
      } else {
        console.warn('❌ Customer status is not approved. Raw status:', statusRaw, 'Normalized:', status)
        setCustomer(null)
        setError(`Your account status is "${statusRaw || 'unknown'}". Please wait for admin approval.`)
      }
    } catch (err) {
      console.error('Exception fetching customer:', err)
      setCustomer(null)
      setError(`Failed to load customer: ${err.message}`)
    }
  }

  const fetchUserBalance = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await authService.getUserProfile(user.id)
      if (error) throw error
      setUserBalance(parseFloat(data?.balance || 0))
    } catch (err) {
      console.error('Error fetching user balance:', err)
      setUserBalance(0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!selectedProduct || !quantity || quantity < 1) {
      setError('Please select a product and enter a valid quantity')
      return
    }

    if (!customer || !customer.id) {
      setError('Customer account not found or not approved. Please contact support or wait for approval.')
      console.error('Order submission failed: No customer data', { customer })
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) {
      setError('Selected product not found')
      return
    }

    if (quantity > product.stock) {
      setError(`Only ${product.stock} items available in stock`)
      return
    }

    const totalAmount = parseFloat(totalPrice)
    
    // Validate payment method
    if (paymentMethod === 'balance') {
      if (userBalance < totalAmount) {
        setError(`Insufficient balance. You have ₱${userBalance.toFixed(2)}, but need ₱${totalAmount.toFixed(2)}`)
        return
      }
    } else if (paymentMethod === 'gcash') {
      if (!gcashNumber || gcashNumber.length < 10) {
        setError('Please enter a valid GCash number')
        return
      }
    } else if (paymentMethod === 'credit_card') {
      if (!cardNumber || cardNumber.length < 16) {
        setError('Please enter a valid card number')
        return
      }
      if (!cardName) {
        setError('Please enter cardholder name')
        return
      }
      if (!cardExpiry) {
        setError('Please enter card expiry date')
        return
      }
      if (!cardCvv || cardCvv.length < 3) {
        setError('Please enter a valid CVV')
        return
      }
    }

    setLoading(true)

    try {
      console.log('Creating order with:', {
        customer_id: customer.id,
        customer_user_id: customer.user_id,
        product_name: product.name,
        quantity: parseInt(quantity),
        totalAmount,
        paymentMethod
      })

      // If paying with balance, deduct from user balance FIRST (before creating order)
      if (paymentMethod === 'balance') {
        const newBalance = userBalance - totalAmount
        console.log('Deducting balance:', { current: userBalance, amount: totalAmount, new: newBalance })
        
        const { error: balanceError } = await authService.updateProfile(user.id, {
          balance: newBalance
        })
        
        if (balanceError) {
          console.error('Error updating balance:', balanceError)
          throw new Error(`Failed to deduct balance: ${balanceError.message}`)
        }
        
        console.log('✅ Balance deducted successfully')
        setUserBalance(newBalance)
      }

      // DEMO MODE: Simulate payment processing for external payment methods
      if (paymentMethod !== 'balance') {
        // Simulate external payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        console.log('DEMO MODE: Processing payment via', paymentMethod)
      }

      // Create order (use customer.id, not customer_id field)
      // Include product_id so orderService can update stock
      const orderData = {
        customer_id: customer.id, // This should be the customer table's id (UUID)
        product_name: product.name,
        product_id: product.id, // Add product_id for stock update
        quantity: parseInt(quantity),
        order_date: new Date().toISOString()
      }
      
      console.log('Creating order with data:', orderData)
      console.log('Customer data for RLS check:', {
        customer_id: customer.id,
        customer_user_id: customer.user_id,
        customer_email: customer.email,
        customer_status: customer.status,
        current_user_id: user.id,
        current_user_email: user.email,
        user_id_match: customer.user_id === user.id,
        email_match: customer.email?.toLowerCase() === user.email?.toLowerCase()
      })
      
      const { data: orderResult, error } = await orderService.createOrder(orderData)

      if (error) {
        console.error('Order creation error:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // If order creation failed and we deducted balance, refund it
        if (paymentMethod === 'balance') {
          console.log('Refunding balance due to order creation failure')
          const { error: refundError } = await authService.updateProfile(user.id, {
            balance: userBalance // Restore original balance
          })
          if (refundError) {
            console.error('Failed to refund balance:', refundError)
          } else {
            setUserBalance(userBalance)
            console.log('✅ Balance refunded successfully')
          }
        }
        
        // Provide helpful error message
        if (error.code === '42501') {
          throw new Error('Order creation failed due to security policy. Please ensure your customer account is approved and linked to your user account. Contact admin if issue persists.')
        }
        throw error
      }

      console.log('✅ Order created successfully:', orderResult)

      setSuccess('Order placed successfully! Stock has been updated.')
      
      // Refresh products to show updated stock (if callback provided)
      if (onOrderPlaced) {
        await onOrderPlaced()
      } else {
        // Fallback: refresh products in this component
        await fetchProducts()
      }
      
      // Reset form
      setSelectedProduct('')
      setQuantity(1)
      setPaymentMethod('balance')
      setGcashNumber('')
      setCardNumber('')
      setCardName('')
      setCardExpiry('')
      setCardCvv('')
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 2000)
    } catch (err) {
      console.error('Error creating order:', err)
      setError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedProductData = products.find(p => p.id === selectedProduct)
  const totalPrice = selectedProductData 
    ? (parseFloat(selectedProductData.price || 0) * parseInt(quantity || 1)).toFixed(2)
    : '0.00'
  
  const canPayWithBalance = userBalance >= parseFloat(totalPrice)
  
  // Debug: Log why button might be disabled
  useEffect(() => {
    if (isOpen) {
      const buttonDisabled = loading || !selectedProduct || !customer || (paymentMethod === 'balance' && !canPayWithBalance)
      console.log('🔍 Order Modal Debug:', {
        isOpen,
        loading,
        selectedProduct: !!selectedProduct,
        selectedProductId: selectedProduct,
        customer: !!customer,
        customerData: customer,
        customerStatus: customer?.status,
        customerId: customer?.id,
        customerUserId: customer?.user_id,
        paymentMethod,
        canPayWithBalance,
        userBalance,
        totalPrice: parseFloat(totalPrice),
        buttonDisabled,
        disabledReasons: {
          loading,
          noProduct: !selectedProduct,
          noCustomer: !customer,
          insufficientBalance: paymentMethod === 'balance' && !canPayWithBalance
        }
      })
    }
  }, [isOpen, loading, selectedProduct, customer, paymentMethod, canPayWithBalance, userBalance, totalPrice])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Place Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Product *
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value)
                  setQuantity(1)
                  setError('')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                required
              >
                <option value="">Choose a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ₱{parseFloat(product.price || 0).toFixed(2)} (Stock: {product.stock})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Details */}
            {selectedProductData && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  {selectedProductData.image && (
                    <img
                      src={selectedProductData.image}
                      alt={selectedProductData.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{selectedProductData.name}</p>
                    <p className="text-sm text-gray-600">
                      Price: ₱{parseFloat(selectedProductData.price || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Available: {selectedProductData.stock} in stock
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1
                  setQuantity(Math.max(1, Math.min(val, selectedProductData?.stock || 1)))
                  setError('')
                }}
                min="1"
                max={selectedProductData?.stock || 1}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                required
              />
              {selectedProductData && (
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {selectedProductData.stock} items
                </p>
              )}
            </div>

            {/* Total Price */}
            {selectedProductData && (
              <div className="bg-primary-blue bg-opacity-10 border border-primary-blue rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Price:</span>
                  <span className="text-xl font-bold text-primary-blue">
                    ₱{totalPrice}
                  </span>
                </div>
              </div>
            )}


            {/* Payment Method */}
            {selectedProductData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value)
                    setError('')
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  required
                >
                  <option value="balance">
                    Account Balance (₱{userBalance.toFixed(2)} available)
                  </option>
                  <option value="gcash">GCash</option>
                  <option value="credit_card">Credit Card</option>
                </select>
                {paymentMethod === 'balance' && userBalance < parseFloat(totalPrice) && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Insufficient balance. You need ₱{(parseFloat(totalPrice) - userBalance).toFixed(2)} more.
                  </p>
                )}
              </div>
            )}

            {/* GCash Payment Details */}
            {selectedProductData && paymentMethod === 'gcash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GCash Number *
                </label>
                <input
                  type="tel"
                  value={gcashNumber}
                  onChange={(e) => {
                    setGcashNumber(e.target.value)
                    setError('')
                  }}
                  placeholder="09XX XXX XXXX"
                  maxLength="11"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  required
                />
                <p className="text-xs text-amber-600 mt-1">⚠️ Demo Mode - No real payment processing</p>
              </div>
            )}

            {/* Credit Card Payment Details */}
            {selectedProductData && paymentMethod === 'credit_card' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number *
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => {
                      setCardNumber(e.target.value)
                      setError('')
                    }}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cardholder Name *
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => {
                      setCardName(e.target.value)
                      setError('')
                    }}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date *
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => {
                        setCardExpiry(e.target.value)
                        setError('')
                      }}
                      placeholder="MM/YY"
                      maxLength="5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV *
                    </label>
                    <input
                      type="text"
                      value={cardCvv}
                      onChange={(e) => {
                        setCardCvv(e.target.value)
                        setError('')
                      }}
                      placeholder="123"
                      maxLength="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-1">⚠️ Demo Mode - No real payment processing</p>
              </>
            )}

            {/* Messages */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
                {success}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                fetchCustomer()
                fetchUserBalance()
              }}
              className="px-3 py-2 text-sm text-primary-blue bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              title="Refresh customer data"
            >
              🔄 Refresh
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedProduct || !customer || (paymentMethod === 'balance' && !canPayWithBalance)}
                className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-[#357abd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  !selectedProduct ? 'Please select a product' :
                  !customer ? `Customer not found. Status: ${customer ? customer.status : 'N/A'}. Click Refresh to reload.` :
                  (paymentMethod === 'balance' && !canPayWithBalance) ? `Insufficient balance. Need ₱${totalPrice}, have ₱${userBalance.toFixed(2)}` :
                  'Place order'
                }
              >
                {loading ? 'Processing Payment...' : 'Place Order & Pay'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OrderModal

