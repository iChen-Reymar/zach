import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import AllOrdersModal from './AllOrdersModal'
import { categoryService } from '../services/categoryService'
import { productService } from '../services/productService'
import { orderService } from '../services/orderService'
import { useAuth } from '../contexts/AuthContext'
import { assetPath } from '../utils/assetPath'

function Home() {
  const navigate = useNavigate()
  const { isAdmin, isStaff } = useAuth()
  const [categories, setCategories] = useState([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAllOrdersModalOpen, setIsAllOrdersModalOpen] = useState(false)

  // Fetch categories and stock data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await categoryService.getAllCategories()
      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Fetch products to count low stock
      const { data: productsData, error: productsError } = await productService.getAllProducts()
      if (productsError) throw productsError
      
      // Count low stock items (stock <= 2)
      const lowStock = (productsData || []).filter(p => p.stock > 0 && p.stock <= 2).length
      setLowStockCount(lowStock)

      // Fetch orders (RLS will automatically filter based on user role)
      // Admin/Staff see all orders, Customers see only their own
      const { data: ordersData, error: ordersError } = await orderService.getAllOrders()
      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        setOrders([])
      } else {
        setOrders(ordersData || [])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setCategories([])
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Get top 4 categories (or all if less than 4)
  const topCategories = categories.slice(0, 4)

  // Get default image for category
  const getDefaultImage = (categoryName) => {
    const categoryImages = {
      'Base Guitar': assetPath('images/Fender-P-Bass-electric-guitar.webp'),
      'Acoustic Guitar': assetPath('images/cac23fb4865901db2c1ba83534e45ee1.jpg_720x720q80.jpg'),
      'Piano Keyboard': assetPath('images/products_2FF03-097-1910-032_2FF03-097-1910-032_1719213023050_1200x1200 (1).webp'),
      'Electric Guitar': assetPath('images/V6MRLB.webp'),
      'Drum': assetPath('images/drum-kit-standard.eb6cdcf0e2d2b6c360fb.png'),
      'Guitar': assetPath('images/V6MRLB.webp')
    }
    return categoryImages[categoryName] || assetPath('images/Fender-P-Bass-electric-guitar.webp')
  }

  return (
    <Layout pageTitle="home">
      <AllOrdersModal
        isOpen={isAllOrdersModalOpen}
        onClose={() => setIsAllOrdersModalOpen(false)}
      />
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Stock Numbers Widget */}
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
              </div>
            </div>

            {/* Top Categories Widget */}
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
                    <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : topCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No categories found. Add categories to see them here.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {topCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => navigate('/categories')}
                      className="aspect-square bg-gray-200 rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <img
                        src={category.image || getDefaultImage(category.name)}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/150?text=${category.name.charAt(0)}`
                        }}
                      />
                    </button>
                  ))}
                  {/* Fill remaining slots if less than 4 categories */}
                  {topCategories.length < 4 && Array.from({ length: 4 - topCategories.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Empty</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* All Orders Widget */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {isAdmin() || isStaff() ? 'All orders' : 'My orders'}
              </h2>
              {(isAdmin() || isStaff()) && (
                <button
                  onClick={() => setIsAllOrdersModalOpen(true)}
                  className="text-primary-blue hover:underline text-sm font-medium cursor-pointer"
                >
                  VIEW ALL
                </button>
              )}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {(isAdmin() || isStaff()) && (
                      <th className="text-left py-3 px-4 text-gray-600 font-semibold">Customer</th>
                    )}
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Product name</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Quantity</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Order date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={(isAdmin() || isStaff()) ? 4 : 3} className="py-8 text-center text-gray-400">
                        Loading orders...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={(isAdmin() || isStaff()) ? 4 : 3} className="py-8 text-center text-gray-400">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        {(isAdmin() || isStaff()) && (
                          <td className="py-3 px-4 text-gray-700">
                            {order.customers?.name || order.customers?.email || 'N/A'}
                          </td>
                        )}
                        <td className="py-3 px-4 text-gray-700">{order.product_name}</td>
                        <td className="py-3 px-4 text-gray-700">{order.quantity}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No orders found</div>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                    {(isAdmin() || isStaff()) && (
                      <div>
                        <span className="text-xs text-gray-500">Customer:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {order.customers?.name || order.customers?.email || 'N/A'}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-gray-500">Product:</span>
                      <p className="text-sm font-medium text-gray-900">{order.product_name}</p>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs text-gray-500">Quantity:</span>
                        <p className="text-sm font-medium text-gray-900">{order.quantity}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Date:</span>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(order.order_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
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

