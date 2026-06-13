import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { useAuth } from '../contexts/AuthContext'
import { statsService } from '../services/statsService'

const PERIODS = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This Week' },
  { id: 'monthly', label: 'This Month' }
]

function Reports() {
  const navigate = useNavigate()
  const { isAdmin, isStaff } = useAuth()
  const [period, setPeriod] = useState('daily')
  const [report, setReport] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const canAccess = isAdmin() || isStaff()

  useEffect(() => {
    if (!canAccess) {
      navigate('/home', { replace: true })
      return
    }
    loadReport()
  }, [period, canAccess])

  const loadReport = async () => {
    try {
      setLoading(true)
      const [fullReport, allStats] = await Promise.all([
        statsService.getFullReport(period),
        statsService.getAllPeriodStats()
      ])
      setReport(fullReport)
      setSummary(allStats)
    } catch (err) {
      console.error('Failed to load report:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount) => `₱${(Number(amount) || 0).toFixed(2)}`

  if (!canAccess) return null

  return (
    <Layout pageTitle="reports">
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-sm text-gray-600 mt-1">
            Income, transactions, and low stock — updated when staff record sales.
          </p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-2xl font-bold text-green-600">{formatMoney(summary.daily.income)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary.daily.transactions} transactions</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-2xl font-bold text-primary-blue">{formatMoney(summary.weekly.income)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary.weekly.transactions} transactions</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-indigo-600">{formatMoney(summary.monthly.income)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary.monthly.transactions} transactions</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.id
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading report...</div>
        ) : report && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-3xl font-bold text-green-700">{formatMoney(report.income)}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-3xl font-bold text-primary-blue">{report.transactions}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Items Sold</p>
                <p className="text-3xl font-bold text-purple-700">{report.itemsSold}</p>
              </div>
            </div>

            {report.totalDiscounts > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Discounts Given</p>
                <p className="text-2xl font-bold text-amber-700">{formatMoney(report.totalDiscounts)}</p>
              </div>
            )}

            {isAdmin() && report.byStaff?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff Sales Report</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600">
                        <th className="py-2 pr-4">Staff</th>
                        <th className="py-2 pr-4">Income</th>
                        <th className="py-2 pr-4">Transactions</th>
                        <th className="py-2">Items Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byStaff.map((row) => (
                        <tr key={row.staffName} className="border-b border-gray-100">
                          <td className="py-3 pr-4 font-medium">{row.staffName}</td>
                          <td className="py-3 pr-4 text-green-700 font-semibold">{formatMoney(row.income)}</td>
                          <td className="py-3 pr-4">{row.transactions}</td>
                          <td className="py-3">{row.itemsSold}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Transactions</h2>
              {report.orders.length === 0 ? (
                <p className="text-gray-500 text-sm">No sales recorded for this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600">
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Product</th>
                        <th className="py-2 pr-4">Qty</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Discount</th>
                        <th className="py-2 pr-4">Staff</th>
                        <th className="py-2">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.orders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-100">
                          <td className="py-3 pr-4 whitespace-nowrap">
                            {new Date(order.order_date).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">{order.product_name}</td>
                          <td className="py-3 pr-4">{order.quantity}</td>
                          <td className="py-3 pr-4 font-semibold text-green-700">
                            {formatMoney(order.total_amount)}
                          </td>
                          <td className="py-3 pr-4 text-amber-700">
                            {Number(order.discount) > 0 ? formatMoney(order.discount) : '—'}
                          </td>
                          <td className="py-3 pr-4">{order.staff_name || '—'}</td>
                          <td className="py-3 capitalize">{order.payment_method || 'cash'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white border border-red-200 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Products</h2>
              {report.lowStock.length === 0 ? (
                <p className="text-gray-500 text-sm">No low stock items right now.</p>
              ) : (
                <div className="space-y-2">
                  {report.lowStock.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center bg-red-50 border border-red-100 rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category_name || 'No category'}</p>
                      </div>
                      <span className="text-red-600 font-bold">{product.stock} left</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default Reports
