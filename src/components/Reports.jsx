import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import SalesDateRangeModal from './SalesDateRangeModal'
import PayUtangModal from './PayUtangModal'
import { useAuth } from '../contexts/AuthContext'
import { statsService } from '../services/statsService'
import { formatDateRange } from '../utils/dateRange'
import { formatPaymentMethod, isUtangPayment, isUtangPaid, isUtangUnpaid, isUtangPartial, getUtangPaidAmount, getUtangRemaining } from '../utils/paymentMethod'

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
  const [payUtangOrder, setPayUtangOrder] = useState(null)

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

  const renderUtangStatus = (order) => {
    if (isUtangPaid(order)) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
          Paid · {formatPaymentMethod(order.utang_paid_method)}
        </span>
      )
    }
    if (isUtangPartial(order)) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
          Partial · {formatMoney(getUtangRemaining(order))} left
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        Pending
      </span>
    )
  }

  const renderUtangAmount = (order) => {
    if (isUtangPartial(order)) {
      return (
        <div>
          <p className="font-semibold text-amber-700">{formatMoney(getUtangRemaining(order))} left</p>
          <p className="text-xs text-green-700">{formatMoney(getUtangPaidAmount(order))} paid</p>
        </div>
      )
    }
    return <span className="font-semibold text-amber-700">{formatMoney(order.total_amount)}</span>
  }

  const renderPayUtangButton = (order) => {
    if (isUtangPaid(order)) return null

    return (
      <button
        type="button"
        onClick={() => setPayUtangOrder(order)}
        className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
        title="Mark as paid"
        aria-label={`Pay utang for ${order.debtor_name || 'customer'}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </button>
    )
  }

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
      <PayUtangModal
        isOpen={!!payUtangOrder}
        onClose={() => setPayUtangOrder(null)}
        order={payUtangOrder}
        onPaid={loadReport}
      />
      <div className="ui-page">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-sm text-gray-600 mt-1">
            Income, transactions, and utang — updated when staff record sales.
          </p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-2xl font-bold text-green-600">{formatMoney(summary.daily.income)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary.daily.paidTransactions} paid sales</p>
              {summary.daily.utangTotal > 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  Utang: {formatMoney(summary.daily.utangTotal)} ({summary.daily.utangTransactions})
                </p>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-2xl font-bold text-primary-blue">{formatMoney(summary.weekly.income)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary.weekly.paidTransactions} paid sales</p>
              {summary.weekly.utangTotal > 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  Utang: {formatMoney(summary.weekly.utangTotal)} ({summary.weekly.utangTransactions})
                </p>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-indigo-600">{formatMoney(summary.monthly.income)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary.monthly.paidTransactions} paid sales</p>
              {summary.monthly.utangTotal > 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  Utang: {formatMoney(summary.monthly.utangTotal)} ({summary.monthly.utangTransactions})
                </p>
              )}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Paid Income</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-700">{formatMoney(report.income)}</p>
                <p className="text-xs text-gray-500 mt-1">{report.paidTransactions} paid sales</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Utang</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-700">{formatMoney(report.utangTotal)}</p>
                <p className="text-xs text-gray-500 mt-1">{report.utangTransactions} utang sales</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary-blue">{formatMoney(report.totalSales)}</p>
                <p className="text-xs text-gray-500 mt-1">{report.transactions} all transactions</p>
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
                        <th>Utang</th>
                        <th>Transactions</th>
                        <th>Items Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byStaff.map((row) => (
                        <tr key={row.staffName} className="border-b border-gray-100">
                          <td className="font-medium">{row.staffName}</td>
                          <td className="text-green-700 font-semibold">{formatMoney(row.income)}</td>
                          <td className="text-amber-700 font-semibold">{formatMoney(row.utangTotal)}</td>
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
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Income</p>
                          <p className="text-green-700 font-semibold">{formatMoney(row.income)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Utang</p>
                          <p className="text-amber-700 font-semibold">{formatMoney(row.utangTotal)}</p>
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

            {report.utangOrders?.length > 0 && (
              <div className="ui-card border-amber-200 bg-amber-50/40">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Utang Sales</h2>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full ui-table">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600">
                        <th>Date</th>
                        <th>Name</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Staff</th>
                        <th className="text-center">Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.utangOrders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-100">
                          <td className="whitespace-nowrap">
                            {new Date(order.order_date).toLocaleString()}
                          </td>
                          <td className="font-semibold text-amber-800">{order.debtor_name || '—'}</td>
                          <td>
                            {order.product_name}
                            {order.size ? <span className="text-gray-500"> · EU {order.size}</span> : null}
                          </td>
                          <td>{order.quantity}</td>
                          <td>{renderUtangAmount(order)}</td>
                          <td>{renderUtangStatus(order)}</td>
                          <td>{order.staff_name || '—'}</td>
                          <td className="text-center">{renderPayUtangButton(order)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="lg:hidden space-y-3">
                  {report.utangOrders.map((order) => (
                    <div key={order.id} className="ui-mobile-card">
                      <div className="flex justify-between gap-2 mb-1">
                        <p className="font-semibold text-amber-800">{order.debtor_name || '—'}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          {renderUtangStatus(order)}
                          {renderPayUtangButton(order)}
                        </div>
                      </div>
                      <div className="mb-1">{renderUtangAmount(order)}</div>
                      <p className="text-sm text-gray-900">{order.product_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(order.order_date).toLocaleString()}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div><span className="text-gray-500">Qty:</span> {order.quantity}</div>
                        <div><span className="text-gray-500">Staff:</span> {order.staff_name || '—'}</div>
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
                        <th>Utang Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.orders.map((order) => (
                          <tr key={order.id} className="border-b border-gray-100">
                            <td className="whitespace-nowrap">
                              {new Date(order.order_date).toLocaleString()}
                            </td>
                            <td>
                              {order.product_name}
                              {order.size ? <span className="text-gray-500"> · EU {order.size}</span> : null}
                            </td>
                            <td>{order.quantity}</td>
                            <td className={`font-semibold ${isUtangUnpaid(order) ? 'text-amber-700' : 'text-green-700'}`}>
                              {formatMoney(order.total_amount)}
                            </td>
                            <td className="text-amber-700">
                              {Number(order.discount) > 0 ? formatMoney(order.discount) : '—'}
                            </td>
                            <td>{order.staff_name || '—'}</td>
                            <td>
                              {isUtangPayment(order.payment_method) ? (
                                <span>
                                  {formatPaymentMethod(order.payment_method)}
                                  {isUtangPaid(order)
                                    ? ' (Paid)'
                                    : isUtangPartial(order)
                                      ? ` (Partial · ${formatMoney(getUtangRemaining(order))} left)`
                                      : ' (Pending)'}
                                </span>
                              ) : (
                                formatPaymentMethod(order.payment_method)
                              )}
                            </td>
                            <td className="font-medium text-amber-800">
                              {order.debtor_name || '—'}
                            </td>
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
                          <p className={`font-bold shrink-0 ${isUtangUnpaid(order) ? 'text-amber-700' : 'text-green-700'}`}>
                            {formatMoney(order.total_amount)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">{new Date(order.order_date).toLocaleString()}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div><span className="text-gray-500">Qty:</span> {order.quantity}</div>
                          <div><span className="text-gray-500">Size:</span> {order.size ? `EU ${order.size}` : '—'}</div>
                          <div><span className="text-gray-500">Staff:</span> {order.staff_name || '—'}</div>
                          <div><span className="text-gray-500">Payment:</span> {isUtangPayment(order.payment_method) ? `${formatPaymentMethod(order.payment_method)}${isUtangPaid(order) ? ' (Paid)' : isUtangPartial(order) ? ` (Partial · ${formatMoney(getUtangRemaining(order))} left)` : ' (Pending)'}` : formatPaymentMethod(order.payment_method)}</div>
                          <div><span className="text-gray-500">Utang:</span> {order.debtor_name || '—'}</div>
                          <div><span className="text-gray-500">Discount:</span> {Number(order.discount) > 0 ? formatMoney(order.discount) : '—'}</div>
                        </div>
                      </div>
                    ))}
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

export default Reports
