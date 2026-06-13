import { useNavigate } from 'react-router-dom'
import BrandText from './BrandText'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <nav className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <BrandText size="sm" variant="dark" />
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

      <main className="flex-1 flex items-center justify-center">
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            Zach Apparel Inventory
          </h1>
          <p className="text-blue-200/80 text-base sm:text-lg max-w-md mx-auto mb-8">
            Manage products, stock, and sales in one place.
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
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-sm text-blue-200/50">
        © {new Date().getFullYear()} Zach Apparel
      </footer>
    </div>
  )
}

export default LandingPage
