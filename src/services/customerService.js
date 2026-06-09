import { localDatabase, generateId } from './localDatabase'

const generateMaskedId = () =>
  '********-' + Math.random().toString(36).substring(2, 6).toUpperCase()

export const customerService = {
  async getAllCustomers() {
    try {
      const data = await localDatabase.getAllCustomers()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getCustomerById(id) {
    try {
      const data = await localDatabase.getCustomerById(id)
      return data
        ? { data, error: null }
        : { data: null, error: { message: 'Customer not found' } }
    } catch (error) {
      return { data: null, error }
    }
  },

  async searchCustomerByEmail(email) {
    try {
      const data = await localDatabase.getCustomerByEmail(email)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async createCustomer(customer) {
    try {
      const data = {
        id: generateId(),
        customer_id: generateMaskedId(),
        name: customer.name,
        email: customer.email?.trim().toLowerCase(),
        role: customer.role || 'Customer',
        user_id: customer.user_id || null,
        status: customer.status || 'pending',
        approved_by: customer.approved_by || null,
        approved_at: customer.approved_at || null,
        created_at: new Date().toISOString()
      }
      await localDatabase.saveCustomer(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async approveCustomer(id, approverId) {
    try {
      const existing = await localDatabase.getCustomerById(id)
      if (!existing) {
        return { data: null, error: { message: 'Customer not found' } }
      }
      const data = {
        ...existing,
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString()
      }
      await localDatabase.saveCustomer(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async rejectCustomer(id, approverId) {
    try {
      const existing = await localDatabase.getCustomerById(id)
      if (!existing) {
        return { data: null, error: { message: 'Customer not found' } }
      }
      const data = {
        ...existing,
        status: 'rejected',
        approved_by: approverId,
        approved_at: new Date().toISOString()
      }
      await localDatabase.saveCustomer(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateCustomer(id, updates) {
    try {
      const existing = await localDatabase.getCustomerById(id)
      if (!existing) {
        return { data: null, error: { message: 'Customer not found' } }
      }
      const data = { ...existing, ...updates, id }
      await localDatabase.saveCustomer(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async deleteCustomer(id) {
    try {
      await localDatabase.deleteCustomer(id)
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  async requestApproval(customerId) {
    try {
      const existing = await localDatabase.getCustomerById(customerId)
      if (!existing) {
        return { data: null, error: { message: 'Customer not found' } }
      }
      const data = {
        ...existing,
        status: 'pending',
        approved_by: null,
        approved_at: null
      }
      await localDatabase.saveCustomer(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getPendingApprovals() {
    try {
      const data = await localDatabase.getPendingCustomers()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getCustomerByUserId(userId) {
    try {
      const data = await localDatabase.getCustomerByUserId(userId)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
