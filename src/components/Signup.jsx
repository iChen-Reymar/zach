import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Signup({ onToggle }) {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await signUp(formData.email, formData.password, formData.name)
      if (error) {
        setError(error.message || 'Failed to create account')
        setLoading(false)
        return
      }
      
      setSuccess('Your account has been created! Redirecting to your dashboard...')
      setTimeout(() => {
        navigate('/home', { replace: true })
      }, 1500)
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl relative px-5">
      {/* Back to Home */}
      <button
        onClick={() => navigate('/')}
        className="absolute -top-12 left-5 text-blue-200 hover:text-white transition-colors flex items-center gap-2 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </button>
      <div className="flex flex-col md:flex-row bg-white rounded-xl overflow-hidden shadow-2xl min-h-[500px] w-full">
        {/* Left Panel - White */}
        <div className="flex-1 p-6 sm:p-12 md:p-16 flex flex-col justify-center bg-white">
          <div className="text-2xl sm:text-3xl font-bold text-primary-blue mb-6 sm:mb-10 text-center">
            Inventory.oc
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              className="px-4 py-3.5 border border-gray-300 rounded-lg text-base outline-none focus:border-primary-blue transition-colors bg-white placeholder:text-gray-400"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={handleChange}
              className="px-4 py-3.5 border border-gray-300 rounded-lg text-base outline-none focus:border-primary-blue transition-colors bg-white placeholder:text-gray-400"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="px-4 py-3.5 border border-gray-300 rounded-lg text-base outline-none focus:border-primary-blue transition-colors bg-white placeholder:text-gray-400"
              required
            />
            {error && (
              <div className="text-red-600 text-sm mt-2">{error}</div>
            )}
            {success && (
              <div className="text-green-700 text-sm mt-2 bg-green-50 border border-green-300 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-800 mb-1">Account Created Successfully!</p>
                    <p className="text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-primary-blue text-white rounded-lg text-base font-semibold cursor-pointer hover:bg-[#357abd] transition-colors mt-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>
        {/* Right Panel - Blue */}
        <div className="flex-1 p-6 sm:p-12 md:p-16 flex flex-col justify-center bg-primary-blue text-white">
          <div className="flex flex-col items-center text-center">
            <p className="text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 text-white">
              Your account is stored locally on this device. The first account created becomes the Admin.
            </p>
            <button
              onClick={onToggle}
              className="px-6 py-3.5 bg-white text-primary-blue rounded-lg text-base font-semibold cursor-pointer hover:bg-gray-100 transition-colors w-full mt-5"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup

