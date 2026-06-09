import { localDatabase, generateId } from './localDatabase'

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
      const orderData = {
        id: generateId(),
        customer_id: order.customer_id,
        product_id: order.product_id || null,
        product_name: order.product_name,
        quantity: order.quantity,
        order_date: order.order_date || new Date().toISOString()
      }

      await localDatabase.saveOrder(orderData)

      if (order.product_id) {
        const stockResult = await localDatabase.decrementProductStock(
          order.product_id,
          order.quantity
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

  async deleteOrder(id) {
    try {
      await localDatabase.deleteOrder(id)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }
}
