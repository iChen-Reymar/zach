import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import AddStaffModal from './AddStaffModal'
import { staffService } from '../services/staffService'
import { useAuth } from '../contexts/AuthContext'

function Staffs() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [staffs, setStaffs] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get user data from profile or user object
  const userName = profile?.name || user?.user_metadata?.name || 'N/A'
  const userEmail = profile?.email || user?.email || 'N/A'
  const userRole = profile?.role || 'Customer'

  // Fetch staff from database
  useEffect(() => {
    fetchStaffs()
  }, [])

  const fetchStaffs = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await staffService.getAllStaff()
      if (error) throw error
      setStaffs(data || [])
    } catch (err) {
      console.error('Error fetching staff:', err)
      setError('Failed to load staff. Using local data.')
      // Fallback to empty array if database fails
      setStaffs([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async (newStaff) => {
    try {
      const { data, error } = await staffService.createStaff(newStaff)
      if (error) throw error
      
      // Refresh the list
      await fetchStaffs()
    } catch (err) {
      console.error('Error adding staff:', err)
      alert('Failed to add staff. Please try again.')
    }
  }

  const handleEditStaff = (staff) => {
    setEditingStaff(staff)
    setIsModalOpen(true)
  }

  const handleUpdateStaff = async (updatedStaff) => {
    try {
      const { error } = await staffService.updateStaff(editingStaff.id, updatedStaff)
      if (error) throw error
      setEditingStaff(null)
      await fetchStaffs()
    } catch (err) {
      console.error('Error updating staff:', err)
      alert('Failed to update staff. Please try again.')
    }
  }

  const handleDeleteStaff = async (staffId) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return
    
    try {
      const { error } = await staffService.deleteStaff(staffId)
      if (error) throw error
      await fetchStaffs()
    } catch (err) {
      console.error('Error deleting staff:', err)
      alert('Failed to delete staff. Please try again.')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingStaff(null)
  }

  const handleStaffSubmit = (staffData) => {
    if (editingStaff) {
      handleUpdateStaff(staffData)
    } else {
      handleAddStaff(staffData)
    }
    handleModalClose()
  }

  return (
    <Layout pageTitle="staffs">
      <AddStaffModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onAddStaff={handleStaffSubmit}
        editingStaff={editingStaff}
      />
      <div className="p-3 sm:p-4">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Staffs</h1>
          
          {/* User Profile Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">User Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name*
                </label>
                <input
                  type="text"
                  value={userName}
                  disabled
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email*
                </label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role*
                </label>
                <input
                  type="text"
                  value={userRole}
                  disabled
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Add Staff Button */}
          <div className="flex items-center justify-end mb-6">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-[#357abd] transition-colors"
            >
              + Add Staff
            </button>
          </div>
        </div>

        {/* Staff - Desktop Table View */}
        <div className="hidden lg:block bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2.5 px-4 text-gray-600 font-semibold">ID</th>
                  <th className="text-left py-2.5 px-4 text-gray-600 font-semibold">Name</th>
                  <th className="text-left py-2.5 px-4 text-gray-600 font-semibold">Role</th>
                  <th className="text-left py-2.5 px-4 text-gray-600 font-semibold">Actions</th>
                  <th className="text-left py-2.5 px-4 text-gray-600 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-400">
                      Loading staff...
                    </td>
                  </tr>
                ) : staffs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-400">
                      No staff found
                    </td>
                  </tr>
                ) : (
                  staffs.map((staff) => (
                    <tr key={staff.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-4 text-gray-900 font-mono">
                        {staff.staff_id}
                      </td>
                      <td className="py-2.5 px-4 text-gray-900 font-medium">
                        {staff.name}
                      </td>
                      <td className="py-2.5 px-4 text-gray-600">
                        {staff.role}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditStaff(staff)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staff.id)}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <button 
                          onClick={() => navigate(`/settings?userId=${staff.user_id || staff.id}`)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          title="View Profile"
                        >
                          <svg
                            className="w-5 h-5 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff - Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading staff...</div>
          ) : staffs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No staff found</div>
          ) : (
            staffs.map((staff) => (
              <div key={staff.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500">ID</p>
                    <p className="text-sm font-mono text-gray-900">{staff.staff_id}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/settings?userId=${staff.user_id || staff.id}`)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    title="View Profile"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-base font-medium text-gray-900">{staff.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm text-gray-600">{staff.role}</p>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleEditStaff(staff)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(staff.id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Staffs

