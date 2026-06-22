import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import SalesDateRangeModal from './SalesDateRangeModal'
import { useAuth } from '../contexts/AuthContext'
import { statsService } from '../services/statsService'
import { formatDateRange } from '../utils/dateRange'

const PERIODS = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This Week' },
  { id: 'monthly', label: 'This Month' }
]

function Reports() {
  const navigate = useNavigate()
  const { isAdmin, isStaff } = useAuth()
  const [period, setPeriod] = useState('daily')
  const [dateRange, setDateRange] = useState({ start: null, end: null })
  const [report, setReport] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const canAccess = isAdmin() || isStaff()
  const isCustomRange = period === 'custom' && dateRange.start && dateRange.end

  useEffect(() => {
    if (!canAccess) {
      navigate('/home', { replace: true })
      return
    }
    loadReport()
  }, [period, dateRange.start, dateRange.end, canAccess])

  const loadReport = async () => {
    try {
      if (period === 'custom' && (!dateRange.start || !dateRange.end)) {
        return
      }

      setLoading(true)
      const allStats = await statsService.getAllPeriodStats()
      setSummary(allStats)

      if (period === 'custom' && dateRange.start && dateRange.end) {
        const customReport = await statsService.getFullReportForDateRange(
          dateRange.start,
          dateRange.end
        )
        setReport(customReport)
        return
      }

      const fullReport = await statsService.getFullReport(period)
      setReport(fullReport)
    } catch (err) {
      console.error('Failed to load report:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod)
    setDateRange({ start: null, end: null })
  }

  const handleRangeChange = (range) => {
    setDateRange(range)
    if (range.start && range.end) {
      setPeriod('custom')
    }
  }

  const handleOpenCalendar = () => {
    setIsCalendarOpen(true)
  }

  const handleCloseCalendar = () => {
    setIsCalendarOpen(false)
  }

  const formatMoney = (amount) => `₱${(Number(amount) || 0).toFixed(2)}`

  const reportTitle = isCustomRange
    ? formatDateRange(dateRange.start, dateRange.end)
    : PERIODS.find((p) => p.id === period)?.label

  if (!canAccess) return null

  return (
    <Layout pageTitle="reports">
      <SalesDateRangeModal
        isOpen={isCalendarOpen}
        onClose={handleCloseCalendar}
        startDate={dateRange.start}
        endDate={dateRange.end}
        onRangeChange={handleRangeChange}
      />
      <div className="ui-page">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Reports</h1>
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

        <div className="flex gap-2 flex-wrap items-center">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePeriodChange(p.id)}
              className={`ui-btn px-4 text-sm ${
                period === p.id
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleOpenCalendar}
            className={`ui-btn px-4 text-sm gap-2 max-w-full ${
              isCustomRange
                ? 'bg-primary-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Select custom date range"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="truncate">{isCustomRange ? formatDateRange(dateRange.start, dateRange.end) : 'Calendar'}</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading report...</div>
        ) : report && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Report for {reportTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-700">{formatMoney(report.income)}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary-blue">{report.transactions}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Items Sold</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-700">{report.itemsSold}</p>
              </div>
            </div>

            {report.totalDiscounts > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Discounts Given</p>
                <p className="text-2xl font-bold text-amber-700">{formatMoney(report.totalDiscounts)}</p>
              </div>
            )}

            {isAdmin() && report.byStaff?.length > 0 && (
              <div className="ui-card">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Staff Sales Report</h2>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full ui-table">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600">
                        <th>Staff</th>
                        <th>Income</th>
                        <th>Transactions</th>
                        <th>Items Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byStaff.map((row) => (
                        <tr key={row.staffName} className="border-b border-gray-100">
                          <td className="font-medium">{row.staffName}</td>
                          <td className="text-green-700 font-semibold">{formatMoney(row.income)}</td>
                          <td>{row.transactions}</td>
                          <td>{row.itemsSold}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="lg:hidden space-y-3">
                  {report.byStaff.map((row) => (
                    <div key={row.staffName} className="ui-mobile-card">
                      <p className="font-semibold text-gray-900">{row.staffName}</p>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Income</p>
                          <p className="text-green-700 font-semibold">{formatMoney(row.income)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Sales</p>
                          <p>{row.transactions}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Items</p>
                          <p>{row.itemsSold}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="ui-card">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">All Transactions</h2>
              {report.orders.length === 0 ? (
                <p className="text-gray-500 text-sm">No sales recorded for this period.</p>
              ) : (
                <>
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full ui-table">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-600">
                          <th>Date</th>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Amount</th>
                          <th>Discount</th>
                          <th>Staff</th>
                          <th>Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.orders.map((order) => (
                          <tr key={order.id} className="border-b border-gray-100">
                            <td className="whitespace-nowrap">
                              {new Date(order.order_date).toLocaleString()}
                            </td>
                            <td>{order.product_name}</td>
                            <td>{order.quantity}</td>
                            <td className="font-semibold text-green-700">
                              {formatMoney(order.total_amount)}
                            </td>
                            <td className="text-amber-700">
                              {Number(order.discount) > 0 ? formatMoney(order.discount) : '—'}
                            </td>
                            <td>{order.staff_name || '—'}</td>
                            <td className="capitalize">{order.payment_method || 'cash'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="lg:hidden space-y-3">
                    {report.orders.map((order) => (
                      <div key={order.id} className="ui-mobile-card">
                        <div className="flex justify-between gap-2 mb-2">
                          <p className="font-semibold text-gray-900 break-words">{order.product_name}</p>
                          <p className="text-green-700 font-bold shrink-0">{formatMoney(order.total_amount)}</p>
                        </div>
                        <p className="text-xs text-gray-500">{new Date(order.order_date).toLocaleString()}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div><span className="text-gray-500">Qty:</span> {order.quantity}</div>
                          <div><span className="text-gray-500">Staff:</span> {order.staff_name || '—'}</div>
                          <div><span className="text-gray-500">Payment:</span> <span className="capitalize">{order.payment_method || 'cash'}</span></div>
                          <div><span className="text-gray-500">Discount:</span> {Number(order.discount) > 0 ? formatMoney(order.discount) : '—'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white border border-red-200 rounded-lg p-3 sm:p-4">
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
