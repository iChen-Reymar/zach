import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Login({ onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const signIn = auth?.signIn
  
  // Get email from navigation state (after signup)
  const signupEmail = location.state?.email
  
  const [formData, setFormData] = useState({
    email: signupEmail || '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Clear loading state if we're no longer on the login page
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
    
    // Validate inputs
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (!signIn || typeof signIn !== 'function') {
        console.error('signIn is not available:', signIn)
        setError('Authentication service is not available. Please refresh the page.')
        setLoading(false)
        return
      }

      console.log('Starting login process...') // Debug
      const result = await signIn(formData.email.trim(), formData.password)
      
      console.log('Sign in result:', result) // Debug
      
      if (result.error) {
        // Handle error with better messages
        let errorMessage = 'Invalid email or password'
        
        // Check error type and message
        if (result.error.message) {
          errorMessage = result.error.message
        } else if (result.error.msg) {
          errorMessage = result.error.msg
        } else if (typeof result.error === 'string') {
          errorMessage = result.error
        }
        
        if (errorMessage.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (errorMessage.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Try logging in instead.'
        }
        
        setError(errorMessage)
        console.error('Login error details:', {
          error: result.error,
          message: errorMessage,
          status: result.error.status,
          code: result.error.code
        }) // Debug
        setLoading(false)
        return
      }
      
      // Check if we have user data
      if (result.data?.user) {
        console.log('Login successful! User:', result.data.user.id) // Debug
        // Clear loading immediately
        setLoading(false)
        // Navigate to home - use replace to prevent back navigation to login
        console.log('Navigating to /home...') // Debug
        navigate('/home', { replace: true })
        console.log('Navigation called') // Debug
      } else {
        console.error('No user data in result:', result) // Debug
        setError('Login failed. No user data returned.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Unexpected login error:', err) // Debug
      setError('An unexpected error occurred. Please try again.')
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
            <button
              type="button"
              className="text-gray-600 text-sm -mt-2.5 mb-2.5 text-right hover:text-primary-blue transition-colors self-end"
              onClick={() => setError('Password reset is not available offline. Contact your admin.')}
            >
              Forgot password
            </button>
            {error && (
              <div className="text-red-600 text-sm mt-2">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-primary-blue text-white rounded-lg text-base font-semibold cursor-pointer hover:bg-[#357abd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        {/* Right Panel - Blue */}
        <div className="flex-1 p-6 sm:p-12 md:p-16 flex flex-col justify-center bg-primary-blue text-white">
          <div className="flex flex-col items-center text-center">
            <p className="text-base sm:text-xl italic leading-relaxed mb-6 sm:mb-10 text-white">
              "Using Inventory.oc changes the way we work. We are now effortless and effective"
            </p>
            <div className="flex flex-col items-center mb-6 sm:mb-8">
              <img 
                src="/images/ceo-photo.jpg" 
                alt="Reymar Obenza"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mb-3 sm:mb-4 border-4 border-white shadow-lg"
              />
              <p className="text-sm sm:text-base text-white font-medium">
                Reymar Obenza, CEO of Sha Store
              </p>
            </div>
            <button
              onClick={onToggle}
              className="px-6 py-3.5 bg-white text-primary-blue rounded-lg text-base font-semibold cursor-pointer hover:bg-gray-100 transition-colors w-full mt-5"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

