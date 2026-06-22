import { useState } from 'react'
import { customerService } from '../services/customerService'

function AddCustomerModal({ isOpen, onClose, onAddCustomer }) {
  const [searchEmail, setSearchEmail] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [foundAccount, setFoundAccount] = useState(null)
  const [isNewAccount, setIsNewAccount] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Customer'
  })

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchEmail) return

    setIsSearching(true)
    try {
      const { data, error } = await customerService.searchCustomerByEmail(searchEmail)
      if (error) throw error
      
      if (data) {
        setFoundAccount(data)
        setFormData({
          name: data.name,
          email: data.email,
          role: data.role || 'Customer'
        })
        setIsNewAccount(false)
      } else {
        setFoundAccount(null)
        setFormData({
          name: '',
          email: searchEmail,
          role: 'Customer'
        })
        setIsNewAccount(true)
      }
    } catch (err) {
      console.error('Error searching customer:', err)
      // If search fails, treat as new account
      setFoundAccount(null)
      setFormData({
        name: '',
        email: searchEmail,
        role: 'Customer'
      })
      setIsNewAccount(true)
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
    if (formData.name && formData.email) {
      onAddCustomer({
        ...formData,
        isNewAccount
      })
      // Reset form
      setSearchEmail('')
      setFormData({
        name: '',
        email: '',
        role: 'Customer'
      })
      setFoundAccount(null)
      setIsNewAccount(false)
      onClose()
    }
  }

  const handleClose = () => {
    setSearchEmail('')
    setFormData({
      name: '',
      email: '',
      role: 'Customer'
    })
    setFoundAccount(null)
    setIsNewAccount(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add Customer</h2>
          <button
            onClick={handleClose}
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
            {/* Search Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter email to search"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || !searchEmail}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Result Message */}
            {foundAccount && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Account found: {foundAccount.name}
                </p>
              </div>
            )}

            {isNewAccount && searchEmail && !foundAccount && !isSearching && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ Account not found. Creating new account.
                </p>
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter customer name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                required
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
                <option value="Customer">Customer</option>
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
              className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-[#357abd] transition-colors"
            >
              {isNewAccount ? 'Create & Request Approval' : 'Add Customer'}
            </button>
          </div>
          {isNewAccount && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ New customers require approval from Admin or Staff before they can access the system.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default AddCustomerModal

