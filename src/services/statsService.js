import { localDatabase } from './localDatabase'
import { productService } from './productService'
import { endOfDay, startOfDay } from '../utils/dateRange'
import { isUtangPayment, isUtangPaid, isUtangUnpaid, getUtangPaidAmount, getUtangRemaining } from '../utils/paymentMethod'

function startOfWeek(date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return d
}

function startOfMonth(date) {
  const d = startOfDay(date)
  d.setDate(1)
  return d
}

function summarizeOrders(orders) {
  const paidOrders = orders.filter((o) => !isUtangPayment(o.payment_method) || isUtangPaid(o))
  const unpaidUtangOrders = orders.filter((o) => isUtangUnpaid(o))
  const allUtangOrders = orders.filter((o) => isUtangPayment(o.payment_method))

  const income = orders.reduce((sum, order) => {
    if (isUtangPayment(order.payment_method)) {
      return sum + getUtangPaidAmount(order)
    }
    return sum + (Number(order.total_amount) || 0)
  }, 0)

  const utangTotal = unpaidUtangOrders.reduce(
    (sum, order) => sum + getUtangRemaining(order),
    0
  )

  const itemsSold = orders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0)
  const totalDiscounts = orders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0)

  const byStaff = {}
  for (const order of orders) {
    const key = order.staff_name || order.staff_id || 'Unknown'
    if (!byStaff[key]) {
      byStaff[key] = {
        staffName: key,
        income: 0,
        utangTotal: 0,
        transactions: 0,
        utangTransactions: 0,
        itemsSold: 0
      }
    }

    if (isUtangPayment(order.payment_method)) {
      byStaff[key].income += getUtangPaidAmount(order)
      const remaining = getUtangRemaining(order)
      if (remaining > 0.001) {
        byStaff[key].utangTotal += remaining
        byStaff[key].utangTransactions += 1
      }
    } else {
      byStaff[key].income += Number(order.total_amount) || 0
    }

    byStaff[key].transactions += 1
    byStaff[key].itemsSold += Number(order.quantity) || 0
  }

  return {
    income,
    utangTotal,
    totalSales: income + utangTotal,
    transactions: orders.length,
    paidTransactions: paidOrders.length,
    utangTransactions: unpaidUtangOrders.length,
    itemsSold,
    totalDiscounts,
    orders,
    utangOrders: allUtangOrders,
    byStaff: Object.values(byStaff).sort((a, b) => (b.income + b.utangTotal) - (a.income + a.utangTotal))
  }
}

export const statsService = {
  async getPeriodStats(period = 'daily') {
    const now = new Date()
    let since
    if (period === 'weekly') since = startOfWeek(now)
    else if (period === 'monthly') since = startOfMonth(now)
    else since = startOfDay(now)

    const orders = await localDatabase.getOrdersSince(since.toISOString())
    return { period, since: since.toISOString(), ...summarizeOrders(orders) }
  },

  async getAllPeriodStats() {
    const [daily, weekly, monthly] = await Promise.all([
      this.getPeriodStats('daily'),
      this.getPeriodStats('weekly'),
      this.getPeriodStats('monthly')
    ])
    return { daily, weekly, monthly }
  },

  async getFullReport(period = 'daily') {
    return this.getPeriodStats(period)
  },

  async getDateRangeStats(startDate, endDate) {
    const start = startOfDay(startDate)
    const end = endOfDay(endDate)
    const orders = await localDatabase.getOrdersBetween(start.toISOString(), end.toISOString())
    return {
      period: 'custom',
      since: start.toISOString(),
      until: end.toISOString(),
      ...summarizeOrders(orders)
    }
  },

  async getFullReportForDateRange(startDate, endDate) {
    return this.getDateRangeStats(startDate, endDate)
  },

  async getInventoryOverview() {
    const { data: products } = await productService.getAllProducts()
    const items = products || []

    let totalStock = 0
    let sellingValue = 0
    let costValue = 0

    const breakdown = items.map((product) => {
      const stock = Number(product.stock) || 0
      const price = Number(product.price) || 0
      const cost = Number(product.cost) || 0
      const lineSellingValue = stock * price
      const lineCostValue = stock * cost

      totalStock += stock
      sellingValue += lineSellingValue
      costValue += lineCostValue

      return {
        id: product.id,
        name: product.name,
        category: product.category_name || product.category || '—',
        stock,
        price,
        cost,
        sellingValue: lineSellingValue,
        costValue: lineCostValue
      }
    }).sort((a, b) => b.stock - a.stock)

    return {
      productCount: items.length,
      totalStock,
      sellingValue,
      costValue,
      products: breakdown
    }
  }
}
