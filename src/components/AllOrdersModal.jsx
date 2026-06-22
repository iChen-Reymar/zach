import { useState, useEffect } from 'react'
import { orderService } from '../services/orderService'
import { useAuth } from '../contexts/AuthContext'

function AllOrdersModal({ isOpen, onClose }) {
  const { isAdmin, isStaff } = useAuth()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchAllOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await orderService.getAllOrders()
      if (error) throw error
      setOrders(data || [])
      setFilteredOrders(data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setOrders([])
      setFilteredOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch all orders when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllOrders()
    } else {
      // Reset state when modal closes
      setOrders([])
      setFilteredOrders([])
      setSearchQuery('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Filter orders when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = orders.filter(order => {
      const customerName = (order.customers?.name || '').toLowerCase()
      const customerEmail = (order.customers?.email || '').toLowerCase()
      const productName = (order.product_name || '').toLowerCase()
      
      return customerName.includes(query) || 
             customerEmail.includes(query) ||
             productName.includes(query)
    })

    setFilteredOrders(filtered)
  }, [searchQuery, orders])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              All Orders
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Loading...' : `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6 text-gray-400"
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

        {/* Search Bar */}
        <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by customer name, email, or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {!searchQuery && (
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Orders Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue mb-4"></div>
              <p>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-lg font-medium mb-2">
                {searchQuery ? 'No orders found' : 'No orders yet'}
              </p>
              <p className="text-sm">
                {searchQuery ? `Try a different search term` : 'Orders will appear here when customers place them'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {(isAdmin() || isStaff()) && (
                        <th className="text-left py-3 px-4 text-gray-600 font-semibold">Customer</th>
                      )}
                      <th className="text-left py-3 px-4 text-gray-600 font-semibold">Product Name</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-semibold">Quantity</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-semibold">Order Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        {(isAdmin() || isStaff()) && (
                          <td className="py-3 px-4 text-gray-700">
                            <div>
                              <p className="font-medium">{order.customers?.name || 'N/A'}</p>
                              {order.customers?.email && (
                                <p className="text-xs text-gray-500">{order.customers.email}</p>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="py-3 px-4 text-gray-700">{order.product_name}</td>
                        <td className="py-3 px-4 text-gray-700">{order.quantity}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {formatDate(order.order_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
                    {(isAdmin() || isStaff()) && (
                      <div className="pb-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Customer</p>
                        <p className="text-sm font-semibold text-gray-900">{order.customers?.name || 'N/A'}</p>
                        {order.customers?.email && (
                          <p className="text-xs text-gray-500 mt-1">{order.customers.email}</p>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Product</p>
                      <p className="text-sm font-medium text-gray-900">{order.product_name}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Quantity</p>
                        <p className="text-base font-semibold text-gray-900">{order.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Order Date</p>
                        <p className="text-base font-semibold text-gray-900">
                          {formatDate(order.order_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {searchQuery && filteredOrders.length > 0 && (
                <span>Showing {filteredOrders.length} of {orders.length} orders</span>
              )}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AllOrdersModal

