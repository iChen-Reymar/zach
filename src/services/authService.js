import { requireSupabase, formatSupabaseAuthError } from '../lib/supabase'
import { supabaseDatabase, generateId } from './supabaseDatabase'

const generateMaskedCustomerId = () =>
  '********-' + Math.random().toString(36).substring(2, 6).toUpperCase()

function mapAuthUser(user) {
  if (!user) return null
  return { id: user.id, email: user.email }
}

function formatAuthError(error) {
  return formatSupabaseAuthError(error)
}

async function resolveSignupRole(supabase) {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    if (error) return 'Customer'
    return (count ?? 0) === 0 ? 'Admin' : 'Customer'
  } catch {
    return 'Customer'
  }
}

export const authService = {
  async signUp(email, password, name) {
    try {
      const supabase = requireSupabase()
      const normalizedEmail = email.trim().toLowerCase()

      if (!normalizedEmail || !password || !name) {
        return { data: null, error: { message: 'Name, email, and password are required' } }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name: name.trim() }
        }
      })

      if (authError) {
        console.error('Supabase signup error:', {
          name: authError.name,
          message: authError.message,
          status: authError.status,
          code: authError.code,
          msg: authError.msg,
          cause: authError.cause
        })
        return { data: null, error: { message: formatAuthError(authError) } }
      }

      const user = authData.user
      if (!user) {
        return { data: null, error: { message: 'Failed to create account. Check your email for a confirmation link.' } }
      }

      let profile = await supabaseDatabase.getProfile(user.id)
      if (!profile) {
        const role = await resolveSignupRole(supabase)
        profile = {
          id: user.id,
          name: name.trim(),
          email: normalizedEmail,
          role,
          balance: 0,
          created_at: new Date().toISOString()
        }
        const { error: profileError } = await supabase.from('profiles').upsert(profile)
        if (profileError) {
          console.error('Profile insert error:', profileError)
          return {
            data: null,
            error: {
              message:
                profileError.message ||
                'Account created but profile failed. Run supabase/schema.sql in your Supabase SQL editor.'
            }
          }
        }
      }

      if (profile.role === 'Customer') {
        const existingCustomer = await supabaseDatabase.getCustomerByUserId(user.id)
        if (!existingCustomer) {
          await supabaseDatabase.saveCustomer({
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
      }

      return {
        data: {
          user: mapAuthUser(user),
          profile
        },
        error: null
      }
    } catch (err) {
      console.error('Signup error:', err)
      return { data: null, error: { message: err.message || 'Failed to create account' } }
    }
  },

  async signIn(email, password) {
    try {
      const supabase = requireSupabase()
      const normalizedEmail = email.trim().toLowerCase()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      })

      if (error) {
        const message = error.message?.includes('Invalid login')
          ? 'Invalid email or password'
          : formatAuthError(error)
        return { data: null, error: { message } }
      }

      return {
        data: { user: mapAuthUser(data.user) },
        error: null
      }
    } catch (err) {
      return { data: null, error: { message: err.message || 'An unexpected error occurred' } }
    }
  },

  async signOut() {
    const supabase = requireSupabase()
    const { error } = await supabase.auth.signOut()
    if (error) return { error: { message: error.message } }
    return { error: null }
  },

  async getCurrentUser() {
    const supabase = requireSupabase()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null
    return mapAuthUser(data.user)
  },

  async getUserProfile(userId) {
    try {
      const profile = await supabaseDatabase.getProfile(userId)
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
      const data = await supabaseDatabase.updateProfile(userId, updates)
      if (!data) {
        return { data: null, error: { message: 'Profile not found' } }
      }
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async changeOwnPassword(userId, currentPassword, newPassword) {
    try {
      const supabase = requireSupabase()

      if (!currentPassword || !newPassword) {
        return { error: { message: 'Current and new password are required' } }
      }
      if (newPassword.length < 6) {
        return { error: { message: 'New password must be at least 6 characters' } }
      }
      if (currentPassword === newPassword) {
        return { error: { message: 'New password must be different from current password' } }
      }

      const user = await this.getCurrentUser()
      if (!user || user.id !== userId) {
        return { error: { message: 'User not found' } }
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      if (verifyError) {
        return { error: { message: 'Current password is incorrect' } }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        return { error: { message: error.message || 'Failed to change password' } }
      }

      return { error: null }
    } catch (err) {
      return { error: { message: err.message || 'Failed to change password' } }
    }
  },

  async setStaffPassword(adminUserId, staffId, newPassword) {
    try {
      const supabase = requireSupabase()

      if (!newPassword) {
        return { error: { message: 'New password is required' } }
      }
      if (newPassword.length < 6) {
        return { error: { message: 'Password must be at least 6 characters' } }
      }

      const adminProfile = await supabaseDatabase.getProfile(adminUserId)
      if (adminProfile?.role !== 'Admin') {
        return { error: { message: 'Only admins can reset staff passwords' } }
      }

      const staff = await supabaseDatabase.getStaffById(staffId)
      if (!staff) {
        return { error: { message: 'Staff member not found' } }
      }
      if (staff.role !== 'Staff') {
        return { error: { message: 'You can only reset passwords for staff members' } }
      }
      if (!staff.email) {
        return { error: { message: 'Staff member has no email. Add an email first.' } }
      }

      const normalizedEmail = staff.email.trim().toLowerCase()
      let userId = staff.user_id

      if (!userId) {
        const existingProfile = await supabaseDatabase.getProfileByEmail(normalizedEmail)
        if (existingProfile) userId = existingProfile.id
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const adminSession = sessionData.session

      if (!userId) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: newPassword,
          options: {
            data: { name: staff.name, role: 'Staff' }
          }
        })

        if (signUpError) {
          return { error: { message: signUpError.message || 'Failed to create staff login' } }
        }

        userId = signUpData.user?.id
        if (!userId) {
          return { error: { message: 'Failed to create staff login account' } }
        }

        await supabaseDatabase.saveProfile({
          id: userId,
          name: staff.name,
          email: normalizedEmail,
          role: 'Staff',
          balance: 0,
          created_at: new Date().toISOString()
        })

        if (adminSession) {
          await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token
          })
        }

        if (staff.user_id !== userId) {
          await supabaseDatabase.saveStaff({ ...staff, user_id: userId })
        }

        return { error: null, data: { email: normalizedEmail } }
      }

      await supabaseDatabase.updateProfile(userId, { role: 'Staff' })
      if (staff.user_id !== userId) {
        await supabaseDatabase.saveStaff({ ...staff, user_id: userId })
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail)
      if (resetError) {
        return { error: { message: resetError.message || 'Failed to send password reset email' } }
      }

      return {
        error: null,
        data: {
          email: normalizedEmail,
          message: 'Staff already has an account. A password reset email was sent.'
        }
      }
    } catch (err) {
      return { error: { message: err.message || 'Failed to set staff password' } }
    }
  },

  onAuthStateChange(callback) {
    const supabase = requireSupabase()
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ? mapAuthUser(session.user) : null)
    })
    return subscription
  }
}
