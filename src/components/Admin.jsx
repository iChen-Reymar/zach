import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { useAuth } from '../contexts/AuthContext'
import { statsService } from '../services/statsService'
import { INVENTORY_UPDATED_EVENT } from '../utils/inventoryEvents'

function Admin() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/home', { replace: true })
      return
    }
    loadOverview()

    const handleRefresh = () => loadOverview()
    window.addEventListener(INVENTORY_UPDATED_EVENT, handleRefresh)
    window.addEventListener('focus', handleRefresh)

    return () => {
      window.removeEventListener(INVENTORY_UPDATED_EVENT, handleRefresh)
      window.removeEventListener('focus', handleRefresh)
    }
  }, [navigate])

  const loadOverview = async () => {
    try {
      setLoading(true)
      const data = await statsService.getInventoryOverview()
      setOverview(data)
    } catch (err) {
      console.error('Failed to load inventory overview:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount) => `₱${(Number(amount) || 0).toFixed(2)}`

  const filteredProducts = useMemo(() => {
    if (!overview?.products) return []
    const query = searchQuery.toLowerCase().trim()
    if (!query) return overview.products

    return overview.products.filter((product) => {
      const name = (product.name || '').toLowerCase()
      const category = (product.category || '').toLowerCase()
      const stock = product.stock?.toString() || ''
      const cost = product.cost?.toString() || ''
      const price = product.price?.toString() || ''

      return (
        name.includes(query) ||
        category.includes(query) ||
        stock.includes(query) ||
        cost.includes(query) ||
        price.includes(query)
      )
    })
  }, [overview, searchQuery])

  const filteredTotals = useMemo(() => {
    return filteredProducts.reduce(
      (acc, product) => ({
        stock: acc.stock + (product.stock || 0),
        costValue: acc.costValue + (product.costValue || 0),
        sellingValue: acc.sellingValue + (product.sellingValue || 0)
      }),
      { stock: 0, costValue: 0, sellingValue: 0 }
    )
  }, [filteredProducts])

  if (!isAdmin()) return null

  return (
    <Layout pageTitle="admin">
      <div className="ui-page">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin</h1>
          <p className="text-sm text-gray-600 mt-1">
            Inventory overview — total stock value and item counts.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading inventory...</div>
        ) : overview && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-gray-600">Stock Value (Selling)</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700 mt-1">
                  {formatMoney(overview.sellingValue)}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-gray-600">Stock Value (Cost)</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">
                  {formatMoney(overview.costValue)}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-gray-600">Total Items in Stock</p>
                <p className="text-xl sm:text-2xl font-bold text-primary-blue mt-1">
                  {overview.totalStock}
                </p>
                <p className="text-xs text-gray-500 mt-1">pairs across all products</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3">
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-xl sm:text-2xl font-bold text-indigo-700 mt-1">
                  {overview.productCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">product types in inventory</p>
              </div>
            </div>

            <div className="ui-card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <h2 className="text-base font-semibold text-gray-900">All Product Stock</h2>
                <div className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
                </div>
              </div>

              {overview.products.length === 0 ? (
                <p className="text-sm text-gray-500">No products in inventory.</p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No products found matching &quot;{searchQuery}&quot;
                </p>
              ) : (
                <>
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full ui-table">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-600">
                          <th>Product</th>
                          <th>Category</th>
                          <th>Stock</th>
                          <th>Cost</th>
                          <th>Selling</th>
                          <th>Stock Value (Cost)</th>
                          <th>Stock Value (Selling)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="border-b border-gray-100">
                            <td className="font-medium text-gray-900">{product.name}</td>
                            <td className="text-gray-600">{product.category}</td>
                            <td className="font-semibold">{product.stock}</td>
                            <td>{formatMoney(product.cost)}</td>
                            <td>{formatMoney(product.price)}</td>
                            <td className="text-amber-700 font-medium">
                              {formatMoney(product.costValue)}
                            </td>
                            <td className="text-green-700 font-semibold">
                              {formatMoney(product.sellingValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-200 font-semibold text-gray-900">
                          <td colSpan={2}>Total</td>
                          <td>{filteredTotals.stock}</td>
                          <td colSpan={2} />
                          <td className="text-amber-700">{formatMoney(filteredTotals.costValue)}</td>
                          <td className="text-green-700">{formatMoney(filteredTotals.sellingValue)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="lg:hidden space-y-3">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="ui-mobile-card">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 break-words">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
                          </div>
                          <span className="text-sm font-bold text-primary-blue shrink-0">{product.stock} stock</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Cost</p>
                            <p>{formatMoney(product.cost)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Selling</p>
                            <p>{formatMoney(product.price)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Value (Cost)</p>
                            <p className="text-amber-700 font-medium">{formatMoney(product.costValue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Value (Selling)</p>
                            <p className="text-green-700 font-semibold">{formatMoney(product.sellingValue)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="ui-mobile-card bg-gray-50 font-semibold text-gray-900">
                      <div className="flex justify-between">
                        <span>Total stock</span>
                        <span>{filteredTotals.stock}</span>
                      </div>
                      <div className="flex justify-between mt-2 text-amber-700">
                        <span>Total value (cost)</span>
                        <span>{formatMoney(filteredTotals.costValue)}</span>
                      </div>
                      <div className="flex justify-between mt-2 text-green-700">
                        <span>Total value (selling)</span>
                        <span>{formatMoney(filteredTotals.sellingValue)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default Admin
