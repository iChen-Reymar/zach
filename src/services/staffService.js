import { localDatabase, generateId } from './localDatabase'

const generateMaskedId = () =>
  '*******-' + Math.random().toString(36).substring(2, 6).toUpperCase()

async function syncProfileRole(userId, role) {
  if (!userId) return
  await localDatabase.updateProfile(userId, { role })
}

export const staffService = {
  async getAllStaff() {
    try {
      const data = await localDatabase.getAllStaff()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getStaffById(id) {
    try {
      const data = await localDatabase.getStaffById(id)
      return data
        ? { data, error: null }
        : { data: null, error: { message: 'Staff not found' } }
    } catch (error) {
      return { data: null, error }
    }
  },

  async createStaff(staff) {
    try {
      const staffRole = staff.role || 'Staff'
      let userId = staff.user_id

      if (!userId && staff.email) {
        const profile = await localDatabase.getProfileByEmail(staff.email)
        if (profile) userId = profile.id
      }

      const data = {
        id: generateId(),
        staff_id: generateMaskedId(),
        name: staff.name,
        email: staff.email?.trim().toLowerCase(),
        role: staffRole,
        user_id: userId || null,
        created_at: new Date().toISOString()
      }

      await localDatabase.saveStaff(data)

      if (userId) {
        await syncProfileRole(userId, staffRole)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateStaff(id, updates) {
    try {
      const currentStaff = await localDatabase.getStaffById(id)
      if (!currentStaff) {
        return { data: null, error: { message: 'Staff not found' } }
      }

      let userId = currentStaff.user_id
      if (!userId && (updates.email || currentStaff.email)) {
        const emailToSearch = updates.email || currentStaff.email
        const profile = await localDatabase.getProfileByEmail(emailToSearch)
        if (profile) {
          userId = profile.id
          updates.user_id = userId
        }
      }

      const data = { ...currentStaff, ...updates, id }
      await localDatabase.saveStaff(data)

      if (userId) {
        await syncProfileRole(userId, updates.role || currentStaff.role)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async deleteStaff(id) {
    try {
      await localDatabase.deleteStaff(id)
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  async searchUserByEmailOrName(searchTerm) {
    try {
      const results = await localDatabase.searchProfiles(searchTerm)
      return { data: results[0] || null, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async checkIfStaffExists(userId) {
    try {
      const data = await localDatabase.getStaffByUserId(userId)
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async getStaffByUserId(userId) {
    try {
      const data = await localDatabase.getStaffByUserId(userId)
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}
