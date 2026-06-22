import { useState } from 'react'

function CashInModal({ isOpen, onClose, onCashIn, currentBalance = 0 }) {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'gcash',
    gcashNumber: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validation
    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amount < 100) {
      setError('Minimum cash in amount is ₱100')
      return
    }

    if (formData.paymentMethod === 'gcash') {
      if (!formData.gcashNumber || formData.gcashNumber.length < 10) {
        setError('Please enter a valid GCash number')
        return
      }
    } else {
      if (!formData.cardNumber || formData.cardNumber.length < 16) {
        setError('Please enter a valid card number')
        return
      }
      if (!formData.cardName) {
        setError('Please enter cardholder name')
        return
      }
      if (!formData.cardExpiry) {
        setError('Please enter card expiry date')
        return
      }
      if (!formData.cardCvv || formData.cardCvv.length < 3) {
        setError('Please enter a valid CVV')
        return
      }
    }

    setLoading(true)

    try {
      // DEMO MODE: Simulate payment processing (no real payment gateway)
      console.log('DEMO MODE: Processing cash in...', {
        amount: amount,
        paymentMethod: formData.paymentMethod,
        paymentDetails: formData.paymentMethod === 'gcash' 
          ? { gcashNumber: formData.gcashNumber }
          : {
              cardNumber: formData.cardNumber,
              cardName: formData.cardName,
              cardExpiry: formData.cardExpiry,
              cardCvv: formData.cardCvv
            }
      })
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // DEMO: Always succeed (in production, this would call a real payment gateway)
      // Call the cash in handler to update balance
      await onCashIn({
        amount: amount,
        paymentMethod: formData.paymentMethod,
        paymentDetails: formData.paymentMethod === 'gcash' 
          ? { gcashNumber: formData.gcashNumber }
          : {
              cardNumber: formData.cardNumber,
              cardName: formData.cardName,
              cardExpiry: formData.cardExpiry,
              cardCvv: formData.cardCvv
            }
      })

      // Reset form
      setFormData({
        amount: '',
        paymentMethod: 'gcash',
        gcashNumber: '',
        cardNumber: '',
        cardName: '',
        cardExpiry: '',
        cardCvv: ''
      })
      onClose()
    } catch (err) {
      console.error('Cash in error:', err)
      setError(err.message || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      amount: '',
      paymentMethod: 'gcash',
      gcashNumber: '',
      cardNumber: '',
      cardName: '',
      cardExpiry: '',
      cardCvv: ''
    })
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Cash In</h2>
            <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ DEMO MODE - No real payment processing</p>
          </div>
          <button
            onClick={handleClose}
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
        <form onSubmit={handleSubmit} className="p-3 sm:p-4">
          <div className="space-y-4">
            {/* Current Balance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-primary-blue">
                ₱{parseFloat(currentBalance || 0).toFixed(2)}
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₱) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount (minimum ₱100)"
                min="100"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum: ₱100.00</p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                required
              >
                <option value="gcash">GCash</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>

            {/* GCash Fields */}
            {formData.paymentMethod === 'gcash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GCash Number *
                </label>
                <input
                  type="tel"
                  name="gcashNumber"
                  value={formData.gcashNumber}
                  onChange={handleChange}
                  placeholder="09XX XXX XXXX"
                  maxLength="11"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  required
                />
              </div>
            )}

            {/* Credit Card Fields */}
            {formData.paymentMethod === 'credit_card' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number *
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
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
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleChange}
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
                      name="cardExpiry"
                      value={formData.cardExpiry}
                      onChange={handleChange}
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
                      name="cardCvv"
                      value={formData.cardCvv}
                      onChange={handleChange}
                      placeholder="123"
                      maxLength="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-[#357abd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing (Demo)...' : 'Cash In (Demo)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CashInModal

