import {
  localDatabase,
  hashPassword,
  verifyPassword,
  generateId
} from './localDatabase'

const generateMaskedCustomerId = () =>
  '********-' + Math.random().toString(36).substring(2, 6).toUpperCase()

export const authService = {
  async signUp(email, password, name) {
    try {
      const normalizedEmail = email.trim().toLowerCase()

      if (!normalizedEmail || !password || !name) {
        return { data: null, error: { message: 'Name, email, and password are required' } }
      }

      const existing = await localDatabase.getUserByEmail(normalizedEmail)
      if (existing) {
        return { data: null, error: { message: 'An account with this email already exists' } }
      }

      const userCount = await localDatabase.countUsers()
      const isFirstUser = userCount === 0
      const role = isFirstUser ? 'Admin' : 'Customer'

      const { passwordHash, salt } = await hashPassword(password)
      const user = await localDatabase.createUser({
        email: normalizedEmail,
        passwordHash,
        salt
      })

      const profile = {
        id: user.id,
        name: name.trim(),
        email: normalizedEmail,
        role,
        balance: 0,
        created_at: new Date().toISOString()
      }
      await localDatabase.saveProfile(profile)

      if (role === 'Customer') {
        await localDatabase.saveCustomer({
          id: generateId(),
          customer_id: generateMaskedCustomerId(),
          name: profile.name,
          email: profile.email,
          role: 'Customer',
          user_id: user.id,
          status: 'pending',
          approved_by: null,
          approved_at: null,
          created_at: new Date().toISOString()
        })
      }

      await localDatabase.setSessionUserId(user.id)

      return {
        data: {
          user: { id: user.id, email: user.email },
          profile
        },
        error: null
      }
    } catch (err) {
      return { data: null, error: { message: err.message || 'Failed to create account' } }
    }
  },

  async signIn(email, password) {
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const user = await localDatabase.getUserByEmail(normalizedEmail)

      if (!user) {
        return { data: null, error: { message: 'Invalid email or password' } }
      }

      const valid = await verifyPassword(password, user.passwordHash, user.salt)
      if (!valid) {
        return { data: null, error: { message: 'Invalid email or password' } }
      }

      await localDatabase.setSessionUserId(user.id)

      return {
        data: { user: { id: user.id, email: user.email } },
        error: null
      }
    } catch (err) {
      return { data: null, error: { message: err.message || 'An unexpected error occurred' } }
    }
  },

  async signOut() {
    await localDatabase.setSessionUserId(null)
    return { error: null }
  },

  async getCurrentUser() {
    const userId = await localDatabase.getSessionUserId()
    if (!userId) return null

    const user = await localDatabase.getUserById(userId)
    if (!user) {
      await localDatabase.setSessionUserId(null)
      return null
    }

    return { id: user.id, email: user.email }
  },

  async getUserProfile(userId) {
    try {
      const profile = await localDatabase.getProfile(userId)
      if (!profile) {
        return { data: null, error: { message: 'Profile not found' } }
      }
      return { data: profile, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async updateProfile(userId, updates) {
    try {
      const data = await localDatabase.updateProfile(userId, updates)
      if (!data) {
        return { data: null, error: { message: 'Profile not found' } }
      }
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}
