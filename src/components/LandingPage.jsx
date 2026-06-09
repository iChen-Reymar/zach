import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

function LandingPage() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: '📦',
      title: 'Smart Inventory',
      description: 'Track your products in real-time with intelligent stock alerts and automated notifications.'
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Get insights into your business with visual reports on stock levels and sales trends.'
    },
    {
      icon: '👥',
      title: 'Team Management',
      description: 'Role-based access for Admin, Staff, and Customers with granular permissions.'
    },
    {
      icon: '📱',
      title: 'Works Offline',
      description: 'Install the app and manage inventory with your own local database — no internet required.'
    },
    {
      icon: '💳',
      title: 'Easy Payments',
      description: 'Integrated balance system with support for GCash and credit card payments.'
    },
    {
      icon: '🔔',
      title: 'Smart Alerts',
      description: 'Never miss low stock warnings or pending approval requests with real-time notifications.'
    }
  ]

  const stats = [
    { value: '10K+', label: 'Products Managed' },
    { value: '500+', label: 'Active Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[600px] h-[600px] -top-48 -right-48 bg-blue-500/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        />
        <div 
          className="absolute w-[400px] h-[400px] top-1/2 -left-32 bg-cyan-500/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * -0.15}px)` }}
        />
        <div 
          className="absolute w-[500px] h-[500px] bottom-0 right-1/4 bg-indigo-500/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        {/* Floating grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Inventory.co
            </span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-2 sm:px-5 sm:py-2.5 text-blue-100 hover:text-white font-medium transition-colors text-sm sm:text-base"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 text-sm sm:text-base"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6 sm:mb-8 animate-pulse">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <span className="text-blue-300 text-xs sm:text-sm font-medium">Works Offline — Install as App</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-4">
            Manage Your Inventory
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Like Never Before
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-blue-100/70 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4">
            A powerful, intuitive inventory management system designed for modern businesses. 
            Track products, manage teams, and grow your business with real-time insights.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-4">
            <button
              onClick={() => navigate('/signup')}
              className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-base sm:text-lg font-bold rounded-2xl hover:from-blue-500 hover:to-cyan-400 transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 flex items-center justify-center gap-3"
            >
              Get Started Free
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/5 border border-white/10 text-white text-base sm:text-lg font-medium rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
            >
              Learn More
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm"
              >
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-blue-200/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-blue-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-base sm:text-xl text-blue-100/60 max-w-2xl mx-auto">
              Powerful features to streamline your inventory management workflow
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl backdrop-blur-sm hover:border-blue-500/30 hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-blue-100/60 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-transparent via-blue-950/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-base sm:text-xl text-blue-100/60">
              Get started in minutes, not hours
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up for free and set up your business profile in seconds.' },
              { step: '02', title: 'Add Products', desc: 'Import or add your products with categories, prices, and stock levels.' },
              { step: '03', title: 'Start Selling', desc: 'Manage orders, track inventory, and grow your business effortlessly.' }
            ].map((item, index) => (
              <div key={index} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-2xl font-bold rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-blue-100/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative p-6 sm:p-12 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/20 rounded-3xl backdrop-blur-xl text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />
            
            <h2 className="relative text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="relative text-base sm:text-xl text-blue-100/70 mb-6 sm:mb-8 max-w-xl mx-auto">
              Join thousands of businesses using Inventory.co to manage their products and grow their revenue.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="relative px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 text-base sm:text-lg font-bold rounded-2xl hover:bg-blue-50 transition-all shadow-2xl hover:scale-105"
            >
              Start Free Trial →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 sm:py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-base sm:text-lg font-bold text-white">Inventory.co</span>
            </div>
            <p className="text-blue-100/40 text-xs sm:text-sm text-center">
              © 2024 Inventory.co. All rights reserved.
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <a href="#" className="text-blue-100/60 hover:text-white transition-colors text-xs sm:text-sm">Privacy</a>
              <a href="#" className="text-blue-100/60 hover:text-white transition-colors text-xs sm:text-sm">Terms</a>
              <a href="#" className="text-blue-100/60 hover:text-white transition-colors text-xs sm:text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

