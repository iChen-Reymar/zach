import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import AllOrdersModal from './AllOrdersModal'
import { categoryService } from '../services/categoryService'
import { productService } from '../services/productService'
import { orderService } from '../services/orderService'
import { statsService } from '../services/statsService'
import { useAuth } from '../contexts/AuthContext'

function Home() {
  const navigate = useNavigate()
  const { isAdmin, isStaff } = useAuth()
  const [categories, setCategories] = useState([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAllOrdersModalOpen, setIsAllOrdersModalOpen] = useState(false)

  const canManageSales = isAdmin() || isStaff()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: categoriesData, error: categoriesError } = await categoryService.getAllCategories()
      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      const { data: productsData, error: productsError } = await productService.getAllProducts()
      if (productsError) throw productsError

      const lowStock = (productsData || []).filter((p) => p.stock > 0 && p.stock <= 2).length
      setLowStockCount(lowStock)

      const { data: ordersData, error: ordersError } = await orderService.getAllOrders()
      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        setOrders([])
      } else {
        setOrders(ordersData || [])
      }

      if (canManageSales) {
        const allStats = await statsService.getAllPeriodStats()
        setStats(allStats)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setCategories([])
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const topCategories = categories.slice(0, 4)
  const formatMoney = (n) => `₱${(Number(n) || 0).toFixed(2)}`

  const renderCategoryImage = (category) => {
    if (category.image) {
      return (
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextElementSibling?.classList.remove('hidden')
          }}
        />
      )
    }

    return null
  }

  const renderCategoryFallback = (category) => (
    <div
      className={`w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-semibold text-xl ${category.image ? 'hidden' : ''}`}
    >
      {category.name.charAt(0).toUpperCase()}
    </div>
  )

  return (
    <Layout pageTitle="home">
      <AllOrdersModal
        isOpen={isAllOrdersModalOpen}
        onClose={() => setIsAllOrdersModalOpen(false)}
      />
      <div className="p-4 sm:p-6">
        {canManageSales && stats && (
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-gray-900">Sales Statistics</h2>
              <button
                onClick={() => navigate('/reports')}
                className="text-primary-blue hover:underline text-sm font-medium"
              >
                View full report
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-green-700">{formatMoney(stats.daily.income)}</p>
                <p className="text-xs text-gray-500">{stats.daily.transactions} sales</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-primary-blue">{formatMoney(stats.weekly.income)}</p>
                <p className="text-xs text-gray-500">{stats.weekly.transactions} sales</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-indigo-700">{formatMoney(stats.monthly.income)}</p>
                <p className="text-xs text-gray-500">{stats.monthly.transactions} sales</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Stock numbers</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Low stock</span>
                <span className="text-2xl font-bold text-red-600">
                  {loading ? '...' : lowStockCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Item categories</span>
                <span className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : categories.length}
                </span>
              </div>
              {canManageSales && (
                <button
                  onClick={() => navigate('/products?sale=1')}
                  className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Record Sale
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Top categories</h2>
              <button
                onClick={() => navigate('/categories')}
                className="text-primary-blue hover:underline text-sm font-medium cursor-pointer"
              >
                VIEW ALL
              </button>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : topCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No categories found.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {topCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => navigate('/categories')}
                    className="aspect-square bg-gray-200 rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer relative"
                  >
                    {renderCategoryImage(category)}
                    {renderCategoryFallback(category)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {canManageSales ? 'Recent sales' : 'My orders'}
            </h2>
            {canManageSales && (
              <button
                onClick={() => setIsAllOrdersModalOpen(true)}
                className="text-primary-blue hover:underline text-sm font-medium cursor-pointer"
              >
                VIEW ALL
              </button>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Product</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Qty</th>
                  {canManageSales && (
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Amount</th>
                  )}
                  {canManageSales && (
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Staff</th>
                  )}
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={canManageSales ? 5 : 3} className="py-8 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={canManageSales ? 5 : 3} className="py-8 text-center text-gray-400">
                      No sales yet
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">{order.product_name}</td>
                      <td className="py-3 px-4 text-gray-700">{order.quantity}</td>
                      {canManageSales && (
                        <td className="py-3 px-4 text-green-700 font-medium">
                          {formatMoney(order.total_amount)}
                        </td>
                      )}
                      {canManageSales && (
                        <td className="py-3 px-4 text-gray-700">{order.staff_name || '—'}</td>
                      )}
                      <td className="py-3 px-4 text-gray-700">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No sales yet</div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <p className="font-medium text-gray-900">{order.product_name}</p>
                  <div className="flex justify-between text-sm">
                    <span>Qty: {order.quantity}</span>
                    {canManageSales && (
                      <span className="text-green-700 font-semibold">{formatMoney(order.total_amount)}</span>
                    )}
                  </div>
                  {canManageSales && (
                    <p className="text-xs text-gray-500">Staff: {order.staff_name || '—'}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(order.order_date).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Home
