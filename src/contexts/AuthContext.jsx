import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { staffService } from '../services/staffService'
import { localStorageService } from '../services/localStorageService'
import { isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({ data: null, error: { message: 'Not initialized' } }),
  signIn: async () => ({ data: null, error: { message: 'Not initialized' } }),
  signOut: async () => ({ error: { message: 'Not initialized' } }),
  isAdmin: () => false,
  isStaff: () => false
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    checkUser()

    const subscription = authService.onAuthStateChange((authUser) => {
      if (authUser) {
        loadUserProfile(authUser).catch((err) => {
          console.error('Error loading profile on auth change:', err)
        })
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      subscription?.subscription?.unsubscribe()
    }
  }, [])

  const syncProfileRoleFromStaff = async (userId) => {
    try {
      const { data: staff } = await staffService.checkIfStaffExists(userId)
      if (staff?.role) {
        const { data: updatedProfile } = await authService.updateProfile(userId, { role: staff.role })
        return updatedProfile?.role || staff.role
      }
      return null
    } catch (err) {
      console.error('Error syncing profile role from staff:', err)
      return null
    }
  }

  const loadUserProfile = async (currentUser) => {
    try {
      const { data, error } = await authService.getUserProfile(currentUser.id)

      if (error || !data) {
        setUser(currentUser)
        setProfile(null)
        return
      }

      const syncedRole = await syncProfileRoleFromStaff(currentUser.id)
      let profileData = data

      if (syncedRole && data.role !== syncedRole) {
        const { data: updatedProfile } = await authService.getUserProfile(currentUser.id)
        profileData = updatedProfile || data
      }

      setUser(currentUser)
      setProfile(profileData)
      localStorageService.saveUserProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
      setUser(currentUser)
      setProfile(null)
    }
  }

  const checkUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        await loadUserProfile(currentUser)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('Error checking user:', error)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, name) => {
    try {
      const { data, error } = await authService.signUp(email, password, name)
      if (error) {
        return { data: null, error }
      }

      if (data?.user) {
        setUser(data.user)
        setProfile(data.profile || null)
        if (data.profile) {
          localStorageService.saveUserProfile(data.profile)
        }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      if (!email || !password) {
        return { data: null, error: { message: 'Email and password are required' } }
      }

      const result = await authService.signIn(email, password)
      if (result.error) {
        return { data: null, error: result.error }
      }

      if (result.data?.user) {
        setUser(result.data.user)
        setLoading(false)
        loadUserProfile(result.data.user).catch((profileError) => {
          console.warn('Profile loading failed:', profileError)
        })
        return { data: result.data, error: null }
      }

      return { data: null, error: { message: 'No user data returned from authentication' } }
    } catch (error) {
      return { data: null, error: error || { message: 'An unexpected error occurred during sign in' } }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await authService.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
      localStorageService.clearAll()
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const isAdmin = () => profile?.role === 'Admin'

  const isStaff = () => profile?.role === 'Staff' || profile?.role === 'Admin'

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    isStaff
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
