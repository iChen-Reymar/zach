import { useState, useEffect } from 'react'
import { staffService } from '../services/staffService'

function AddStaffModal({ isOpen, onClose, onAddStaff, editingStaff }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [foundUser, setFoundUser] = useState(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [isAlreadyStaff, setIsAlreadyStaff] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Staff',
    user_id: null
  })

  // Update form when editing staff changes
  useEffect(() => {
    if (editingStaff) {
      setFormData({
        name: editingStaff.name || '',
        email: editingStaff.email || '',
        role: editingStaff.role || 'Staff',
        user_id: editingStaff.user_id || null
      })
      setFoundUser(null)
      setIsNewUser(false)
      setIsAlreadyStaff(false)
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'Staff',
        user_id: null
      })
      setFoundUser(null)
      setIsNewUser(false)
      setIsAlreadyStaff(false)
      setSearchTerm('')
    }
  }, [editingStaff, isOpen])

  const roles = ['Staff', 'Admin']

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setIsAlreadyStaff(false)
    try {
      const { data, error } = await staffService.searchUserByEmailOrName(searchTerm)
      if (error) throw error
      
      if (data) {
        // Check if user is already a staff member
        const { data: existingStaff } = await staffService.checkIfStaffExists(data.id)
        
        if (existingStaff) {
          setIsAlreadyStaff(true)
          setFoundUser(null)
          setFormData({
            name: '',
            email: '',
            role: 'Staff',
            user_id: null
          })
        } else {
          setFoundUser(data)
          setFormData({
            name: data.name,
            email: data.email,
            role: formData.role || 'Staff',
            user_id: data.id
          })
          setIsNewUser(false)
        }
      } else {
        setFoundUser(null)
        setFormData({
          name: '',
          email: searchTerm.includes('@') ? searchTerm : '',
          role: 'Staff',
          user_id: null
        })
        setIsNewUser(true)
      }
    } catch (err) {
      console.error('Error searching user:', err)
      setFoundUser(null)
      setFormData({
        name: '',
        email: searchTerm.includes('@') ? searchTerm : '',
        role: 'Staff',
        user_id: null
      })
      setIsNewUser(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.name && formData.email && formData.role) {
      onAddStaff({
        ...formData
      })
      // Reset form
      setSearchTerm('')
      setFormData({
        name: '',
        email: '',
        role: 'Staff',
        user_id: null
      })
      setFoundUser(null)
      setIsNewUser(false)
      setIsAlreadyStaff(false)
      onClose()
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    setFormData({
      name: '',
      email: '',
      role: 'Staff',
      user_id: null
    })
    setFoundUser(null)
    setIsNewUser(false)
    setIsAlreadyStaff(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {editingStaff ? 'Edit Staff' : 'Add Staff'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4">
          <div className="space-y-4">
            {/* Search User */}
            {!editingStaff && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Email or Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter email or name to search"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching || !searchTerm.trim()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            )}

            {/* Search Result Messages */}
            {foundUser && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ User found: {foundUser.name} ({foundUser.email})
                </p>
              </div>
            )}

            {isAlreadyStaff && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ This user is already a staff member.
                </p>
              </div>
            )}

            {isNewUser && searchTerm && !foundUser && !isSearching && !isAlreadyStaff && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ User not found. You can add them as new staff.
                </p>
              </div>
            )}

            {/* Staff Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter staff name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                required
                disabled={!!foundUser}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                required
                disabled={!!foundUser}
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                required
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAlreadyStaff}
              className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-[#357abd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingStaff ? 'Update Staff' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddStaffModal

