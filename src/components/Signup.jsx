import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BrandText from './BrandText'
import VpsSetupHelp, { isVpsAuthError } from './VpsSetupHelp'

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
      const { error } = await signUp(formData.email, formData.password, formData.name)
      if (error) {
        setError(error.message || 'Failed to create account')
        setLoading(false)
        return
      }

      setSuccess('Account created! Redirecting...')
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
        <div className="flex justify-center mb-6">
          <BrandText size="lg" variant="light" />
        </div>
        <p className="text-gray-500 text-sm text-center mb-6">Create your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="px-4 py-3 border border-gray-300 rounded-lg text-base outline-none focus:border-primary-blue"
            required
          />
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

          {error && (
            <div className="space-y-3">
              <div className="text-red-600 text-sm">{error}</div>
              {(isVpsAuthError(error)) && <VpsSetupHelp onSignIn={onToggle} />}
            </div>
          )}
          {success && (
            <div className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-[#357abd] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <button type="button" onClick={onToggle} className="text-primary-blue font-medium hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

export default Signup
