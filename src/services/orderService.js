import { localDatabase, generateId } from './localDatabase'
import { isUtangPayment, getUtangPaidAmount, getUtangRemaining } from '../utils/paymentMethod'
import { notifyInventoryUpdated } from '../utils/inventoryEvents'

async function enrichOrders(orders) {
  return Promise.all(orders.map((order) => localDatabase.enrichOrderWithCustomer(order)))
}

export const orderService = {
  async getAllOrders() {
    try {
      const orders = await localDatabase.getAllOrders()
      const data = await enrichOrders(orders)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getCustomerOrders(customerId) {
    try {
      const orders = await localDatabase.getOrdersByCustomerId(customerId)
      const data = await enrichOrders(orders)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getOrderById(id) {
    try {
      const order = await localDatabase.getOrderById(id)
      if (!order) {
        return { data: null, error: { message: 'Order not found' } }
      }
      const data = await localDatabase.enrichOrderWithCustomer(order)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async createOrder(order) {
    try {
      const unitPrice = Number(order.unit_price) || 0
      const listUnitPrice = Number(order.list_unit_price) || unitPrice
      const quantity = Number(order.quantity) || 0
      const discount = Number(order.discount) || 0
      const totalAmount = Number(order.total_amount) || unitPrice * quantity

      const orderData = {
        id: generateId(),
        customer_id: order.customer_id || null,
        product_id: order.product_id || null,
        product_name: order.product_name,
        quantity,
        unit_price: unitPrice,
        list_unit_price: listUnitPrice,
        discount,
        total_amount: totalAmount,
        staff_id: order.staff_id || null,
        staff_name: order.staff_name || null,
        payment_method: order.payment_method || 'cash',
        size: order.size || null,
        debtor_name: order.debtor_name || null,
        utang_paid: 0,
        utang_paid_at: null,
        utang_paid_method: null,
        utang_paid_amount: 0,
        stock_deducted: false,
        order_date: order.order_date || new Date().toISOString()
      }

      await localDatabase.saveOrder(orderData)

      const shouldDeductStock = order.product_id && !isUtangPayment(order.payment_method)
      if (shouldDeductStock) {
        const stockResult = await localDatabase.decrementProductStock(
          order.product_id,
          order.quantity,
          order.size || null
        )

        if (!stockResult.success) {
          return {
            data: orderData,
            error: {
              message: stockResult.error || 'Stock update failed',
              stockUpdateError: stockResult
            }
          }
        }

        orderData.stock_deducted = true
        await localDatabase.saveOrder(orderData)
        notifyInventoryUpdated()
      }

      return { data: orderData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateOrder(id, updates) {
    try {
      const existing = await localDatabase.getOrderById(id)
      if (!existing) {
        return { data: null, error: { message: 'Order not found' } }
      }
      const data = { ...existing, ...updates, id }
      await localDatabase.saveOrder(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async payUtang(id, { amount, paymentMethod }) {
    try {
      const existing = await localDatabase.getOrderById(id)
      if (!existing) {
        return { data: null, error: { message: 'Order not found' } }
      }
      if (!isUtangPayment(existing.payment_method)) {
        return { data: null, error: { message: 'This order is not an utang sale' } }
      }

      const totalAmount = Number(existing.total_amount) || 0
      const alreadyPaid = getUtangPaidAmount(existing)
      const remaining = getUtangRemaining(existing)

      if (remaining <= 0.001) {
        return { data: null, error: { message: 'This utang is already fully paid' } }
      }

      const payAmount = amount === undefined || amount === null
        ? remaining
        : Number(amount)

      if (!Number.isFinite(payAmount) || payAmount <= 0) {
        return { data: null, error: { message: 'Enter a valid payment amount' } }
      }

      if (payAmount > remaining + 0.001) {
        return { data: null, error: { message: `Payment cannot exceed remaining balance of ₱${remaining.toFixed(2)}` } }
      }

      const newPaidAmount = alreadyPaid + payAmount
      const fullyPaid = newPaidAmount >= totalAmount - 0.001

      if (fullyPaid && existing.product_id && !existing.stock_deducted) {
        const stockResult = await localDatabase.decrementProductStock(
          existing.product_id,
          existing.quantity,
          existing.size || null
        )

        if (!stockResult.success) {
          return {
            data: null,
            error: { message: stockResult.error || 'Cannot complete payment — insufficient stock' }
          }
        }
      }

      const data = {
        ...existing,
        id,
        utang_paid_amount: newPaidAmount,
        utang_paid: fullyPaid,
        utang_paid_at: fullyPaid ? new Date().toISOString() : existing.utang_paid_at,
        utang_paid_method: paymentMethod || 'cash',
        stock_deducted: existing.stock_deducted || (fullyPaid && !!existing.product_id)
      }
      await localDatabase.saveOrder(data)

      if (fullyPaid && existing.product_id && !existing.stock_deducted) {
        notifyInventoryUpdated()
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async markUtangPaid(id, options) {
    return this.payUtang(id, options)
  },

  async deleteOrder(id) {
    try {
      await localDatabase.deleteOrder(id)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }
}
