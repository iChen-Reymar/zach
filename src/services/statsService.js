import { localDatabase } from './localDatabase'
import { productService } from './productService'

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

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
  const income = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
  const itemsSold = orders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0)
  const totalDiscounts = orders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0)

  const byStaff = {}
  for (const order of orders) {
    const key = order.staff_name || order.staff_id || 'Unknown'
    if (!byStaff[key]) {
      byStaff[key] = { staffName: key, income: 0, transactions: 0, itemsSold: 0 }
    }
    byStaff[key].income += Number(order.total_amount) || 0
    byStaff[key].transactions += 1
    byStaff[key].itemsSold += Number(order.quantity) || 0
  }

  return {
    income,
    transactions: orders.length,
    itemsSold,
    totalDiscounts,
    orders,
    byStaff: Object.values(byStaff).sort((a, b) => b.income - a.income)
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

  async getLowStockProducts() {
    const { data } = await productService.getAllProducts()
    return (data || []).filter((p) => p.stock > 0 && p.stock <= 2)
  },

  async getFullReport(period = 'daily') {
    const [stats, lowStock] = await Promise.all([
      this.getPeriodStats(period),
      this.getLowStockProducts()
    ])
    return { ...stats, lowStock }
  }
}
