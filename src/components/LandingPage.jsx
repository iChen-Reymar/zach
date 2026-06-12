import { useNavigate } from 'react-router-dom'
import GetApp from './GetApp'
import { isMobileDevice } from '../utils/device'

function LandingPage() {
  const navigate = useNavigate()

  const features = [
    { title: 'Products & Stock', description: 'Add products, track stock, and manage categories.' },
    { title: 'Team Access', description: 'Admin, staff, and customer roles with simple permissions.' },
    { title: 'Works Offline', description: 'Use on Windows desktop or phone browser with local data storage.' }
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-lg font-bold">Inventory.co</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-200 hover:text-white"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            Simple Inventory Management
          </h1>
          <p className="text-blue-200/80 text-base sm:text-lg max-w-xl mx-auto mb-8">
            {isMobileDevice()
              ? 'Track products and manage inventory on your phone — open in browser, no Windows file needed.'
              : 'Track products and manage inventory on Windows desktop or in your phone browser.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-6 py-3 border border-white/20 hover:bg-white/5 rounded-lg font-medium"
            >
              Login
            </button>
          </div>
        </section>

        {/* Features - 3 only */}
        <section className="max-w-4xl mx-auto px-4 pb-12">
          <div className="grid sm:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-5 bg-white/5 border border-white/10 rounded-xl text-left"
              >
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-blue-200/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Get App — phone browser or Windows download */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <h2 className="text-center text-lg font-semibold text-blue-200 mb-4">
            {isMobileDevice() ? 'Use on Your Phone' : 'Get the App'}
          </h2>
          <div className="bg-white rounded-xl p-1">
            <GetApp variant="card" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-sm text-blue-200/50">
        © {new Date().getFullYear()} Inventory.co
      </footer>
    </div>
  )
}

export default LandingPage
