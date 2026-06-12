import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import { customerService } from '../services/customerService'
import GetApp from './GetApp'

function Settings() {
  const { user, profile, isAdmin } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [viewingUserId, setViewingUserId] = useState(null)
  const [viewingProfile, setViewingProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [customer, setCustomer] = useState(null)
  const [requestingApproval, setRequestingApproval] = useState(false)

  // Check if viewing another user's profile
  const userIdParam = searchParams.get('userId')
  const isViewingOtherUser = userIdParam && userIdParam !== user?.id
  const canEdit = isAdmin() && isViewingOtherUser

  // Fetch customer data for own profile
  const fetchCustomerData = async () => {
    if (!user?.id || isViewingOtherUser) return
    try {
      const { data, error } = await customerService.getCustomerByUserId(user.id)
      if (error) {
        console.error('Error fetching customer:', error)
      } else {
        setCustomer(data)
      }
    } catch (err) {
      console.error('Error fetching customer data:', err)
    }
  }

  // Fetch profile data and customer data
  useEffect(() => {
    const fetchProfile = async () => {
      if (userIdParam) {
        setViewingUserId(userIdParam)
        setLoading(true)
        try {
          const { data: profileData, error: profileError } = await authService.getUserProfile(userIdParam)
          if (profileError) {
            console.error('Error fetching profile:', profileError)
            setError('Failed to load profile')
          } else if (profileData) {
            setViewingProfile(profileData)
            setFormData({
              name: profileData.name || 'N/A',
              email: profileData.email || 'N/A',
              role: profileData.role || 'Customer'
            })
          }
        } catch (err) {
          console.error('Error fetching profile:', err)
          setError('Failed to load profile')
        } finally {
          setLoading(false)
        }
      } else {
        // Fetch customer data for own profile if user is a customer
        if (user?.id && (profile?.role === 'Customer' || !profile)) {
          fetchCustomerData()
        }
      }
    }
    fetchProfile()
  }, [userIdParam, user?.id, profile?.role])

  // Get display data
  const displayProfile = viewingProfile || profile
  const displayName = formData.name || displayProfile?.name || user?.user_metadata?.name || 'N/A'
  const displayEmail = formData.email || displayProfile?.email || user?.email || 'N/A'
  const displayRole = formData.role || displayProfile?.role || 'Customer'
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    if (!canEdit || !viewingUserId) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Update profile
      const { error: profileError } = await authService.updateProfile(viewingUserId, {
        name: formData.name,
        email: formData.email,
        role: formData.role
      })

      if (profileError) throw profileError

      // Also update customer record if exists
      try {
        const { data: customer } = await customerService.getCustomerById(viewingUserId)
        if (customer) {
          await customerService.updateCustomer(viewingUserId, {
            name: formData.name,
            email: formData.email,
            role: formData.role
          })
        }
      } catch (err) {
        console.warn('Customer update failed (may not be a customer):', err)
      }

      setSuccess('Profile updated successfully!')
      // Reload profile
      const { data: updatedProfile } = await authService.getUserProfile(viewingUserId)
      if (updatedProfile) {
        setViewingProfile(updatedProfile)
        setFormData({
          name: updatedProfile.name || 'N/A',
          email: updatedProfile.email || 'N/A',
          role: updatedProfile.role || 'Customer'
        })
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (viewingProfile) {
      setFormData({
        name: viewingProfile.name || 'N/A',
        email: viewingProfile.email || 'N/A',
        role: viewingProfile.role || 'Customer'
      })
    }
    setError('')
    setSuccess('')
  }

  const handleRequestApproval = async () => {
    if (!customer?.id) {
      setError('Customer record not found. Please contact support.')
      return
    }

    setRequestingApproval(true)
    setError('')
    setSuccess('')

    try {
      const { error: requestError } = await customerService.requestApproval(customer.id)
      if (requestError) throw requestError

      setSuccess('Approval request sent successfully! Admin will be notified.')
      // Refresh customer data
      await fetchCustomerData()
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      console.error('Error requesting approval:', err)
      setError(err.message || 'Failed to send approval request. Please try again.')
    } finally {
      setRequestingApproval(false)
    }
  }

  if (loading) {
    return (
      <Layout pageTitle="settings">
        <div className="p-6">
          <div className="text-center py-8 text-gray-400">Loading profile...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout pageTitle="settings">
      <div className="p-4 sm:p-6">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {isViewingOtherUser ? 'User Profile' : 'Settings'}
            </h1>
            {isViewingOtherUser && (
              <button
                onClick={() => navigate('/customers')}
                className="text-sm text-primary-blue hover:underline"
              >
                ← Back to Customers
              </button>
            )}
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-[#357abd] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            {success}
          </div>
        )}

        {!isViewingOtherUser && (
          <div className="mb-4 sm:mb-6 space-y-4">
            <GetApp variant="card" />
          </div>
        )}

        {/* User Details Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">User Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name*
              </label>
              <input
                type="text"
                name="name"
                value={canEdit ? formData.name : displayName}
                onChange={handleChange}
                disabled={!canEdit}
                readOnly={!canEdit}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  canEdit
                    ? 'bg-white text-gray-900 focus:outline-none focus:border-primary-blue'
                    : 'bg-gray-50 text-gray-700 cursor-not-allowed'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email*
              </label>
              <input
                type="email"
                name="email"
                value={canEdit ? formData.email : displayEmail}
                onChange={handleChange}
                disabled={!canEdit}
                readOnly={!canEdit}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  canEdit
                    ? 'bg-white text-gray-900 focus:outline-none focus:border-primary-blue'
                    : 'bg-gray-50 text-gray-700 cursor-not-allowed'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role*
              </label>
              {canEdit ? (
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-primary-blue"
                >
                  <option value="Customer">Customer</option>
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={displayRole}
                  disabled
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              )}
            </div>
          </div>

          {/* Approval Request Section - Only for customers who are not approved */}
          {!isViewingOtherUser && displayRole === 'Customer' && customer && customer.status !== 'approved' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Account Status</p>
                    <p className="text-lg font-bold text-amber-700 mb-2">
                      {customer.status === 'pending' ? '⏳ Pending Approval' : '❌ Not Approved'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {customer.status === 'pending' 
                        ? 'Your approval request is pending. Admin will review it soon.'
                        : 'Your account needs approval to access all features. Click the button below to request approval.'}
                    </p>
                  </div>
                  <button
                    onClick={handleRequestApproval}
                    disabled={requestingApproval || customer.status === 'pending'}
                    className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {requestingApproval ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Requesting...
                      </>
                    ) : customer.status === 'pending' ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Request Sent
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Request Approval
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}

export default Settings

