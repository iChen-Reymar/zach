import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isElectron } from '../utils/isElectron'
import { getDefaultAdminCredentials } from '../services/localDatabase'

function Login({ onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const signIn = auth?.signIn

  const signupEmail = location.state?.email

  const [formData, setFormData] = useState({
    email: signupEmail || '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const defaultAdmin = isElectron() ? getDefaultAdminCredentials() : null

  useEffect(() => {
    if (location.pathname !== '/' && location.pathname !== '/login') {
      setLoading(false)
    }
  }, [location.pathname])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (!signIn || typeof signIn !== 'function') {
        setError('Authentication service is not available. Please refresh the page.')
        setLoading(false)
        return
      }

      const result = await signIn(formData.email.trim(), formData.password)

      if (result.error) {
        let errorMessage = result.error.message || 'Invalid email or password'
        if (errorMessage.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        }
        setError(errorMessage)
        setLoading(false)
        return
      }

      if (result.data?.user) {
        setLoading(false)
        navigate('/home', { replace: true })
      } else {
        setError('Login failed. No user data returned.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Unexpected login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md relative">
      <button
        onClick={() => navigate('/')}
        className="absolute -top-10 left-0 text-blue-200 hover:text-white transition-colors flex items-center gap-2 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </button>

      <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 w-full">
        <h1 className="text-2xl font-bold text-primary-blue text-center mb-2">Inventory.co</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="px-4 py-3 border border-gray-300 rounded-lg text-base outline-none focus:border-primary-blue"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="px-4 py-3 border border-gray-300 rounded-lg text-base outline-none focus:border-primary-blue"
            required
          />

          {defaultAdmin && (
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="font-medium text-gray-700 mb-1">Default desktop admin</p>
              <p>Email: <span className="font-mono">{defaultAdmin.email}</span></p>
              <p>Password: <span className="font-mono">{defaultAdmin.password}</span></p>
            </div>
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-[#357abd] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={onToggle} className="text-primary-blue font-medium hover:underline">
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
