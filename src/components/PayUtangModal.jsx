import { useEffect, useState } from 'react'
import { orderService } from '../services/orderService'
import { formatPaymentMethod, getUtangPaidAmount, getUtangRemaining } from '../utils/paymentMethod'

function PayUtangModal({ isOpen, onClose, order, onPaid }) {
  const [paymentType, setPaymentType] = useState('full')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [partialAmount, setPartialAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && order) {
      setPaymentType('full')
      setPaymentMethod('cash')
      setPartialAmount('')
      setError('')
    }
  }, [isOpen, order])

  if (!isOpen || !order) return null

  const formatMoney = (amount) => `₱${(Number(amount) || 0).toFixed(2)}`
  const totalAmount = Number(order.total_amount) || 0
  const alreadyPaid = getUtangPaidAmount(order)
  const remaining = getUtangRemaining(order)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const amount = paymentType === 'full' ? remaining : parseFloat(partialAmount)

      const { error: payError } = await orderService.payUtang(order.id, {
        amount,
        paymentMethod
      })

      if (payError) throw new Error(payError.message || 'Failed to record payment')

      if (onPaid) await onPaid()
      onClose()
    } catch (err) {
      console.error('Pay utang error:', err)
      setError(err.message || 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ui-modal-shell">
      <div className="ui-modal-panel max-w-md">
        <div className="ui-modal-header">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Pay Utang</h2>
          <button onClick={onClose} className="ui-touch text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ui-modal-body space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-gray-600">Name</span>
              <span className="font-semibold text-amber-800">{order.debtor_name || '—'}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-600">Product</span>
              <span className="font-medium text-gray-900 text-right">
                {order.product_name}
                {order.size ? ` · EU ${order.size}` : ''}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-600">Total</span>
              <span className="font-bold text-gray-900">{formatMoney(totalAmount)}</span>
            </div>
            {alreadyPaid > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-gray-600">Already Paid</span>
                <span className="font-semibold text-green-700">{formatMoney(alreadyPaid)}</span>
              </div>
            )}
            <div className="flex justify-between gap-2 border-t border-amber-200 pt-2">
              <span className="text-gray-600 font-medium">Remaining</span>
              <span className="font-bold text-amber-700">{formatMoney(remaining)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('full')}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  paymentType === 'full'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Full Payment
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('partial')}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  paymentType === 'partial'
                    ? 'border-primary-blue bg-blue-50 text-primary-blue'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Partial Payment
              </button>
            </div>
          </div>

          {paymentType === 'partial' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Pay *</label>
              <input
                type="number"
                min="0.01"
                max={remaining}
                step="0.01"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                placeholder={`Max ${formatMoney(remaining)}`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Remaining after payment: {formatMoney(Math.max(0, remaining - (parseFloat(partialAmount) || 0)))}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
            >
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="card">Card</option>
            </select>
          </div>

          <p className="text-sm text-gray-600">
            {paymentType === 'full'
              ? `Full payment of ${formatMoney(remaining)} will deduct stock and update Admin inventory.`
              : 'Partial payments add to paid income. Stock deducts only when fully paid.'}
          </p>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
          )}

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
              disabled={loading || (paymentType === 'partial' && !partialAmount)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading
                ? 'Saving...'
                : paymentType === 'full'
                  ? 'Pay Full Amount'
                  : 'Record Partial Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PayUtangModal
