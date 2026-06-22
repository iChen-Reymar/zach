import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NotificationDropdown from './NotificationDropdown'
import { productService } from '../services/productService'
import { customerService } from '../services/customerService'
import { categoryService } from '../services/categoryService'
import { staffService } from '../services/staffService'
import BrandText from './BrandText'

function Layout({ children, pageTitle = 'home' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, isAdmin, isStaff, profile } = useAuth()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  
  // Global search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef(null)
  
  // Debug: Log role information
  console.log('Layout - Profile:', profile, 'Is Admin:', isAdmin())

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Global search function
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        setShowSearchResults(false)
        return
      }

      setIsSearching(true)
      const query = searchQuery.toLowerCase().trim()
      const results = []

      try {
        // Search Products
        const { data: products } = await productService.getAllProducts()
        if (products) {
          const matchedProducts = products.filter(p => 
            p.name?.toLowerCase().includes(query) ||
            p.category_name?.toLowerCase().includes(query) ||
            p.status?.toLowerCase().includes(query)
          ).slice(0, 5)
          
          matchedProducts.forEach(p => {
            results.push({
              type: 'product',
              icon: '📦',
              title: p.name,
              subtitle: `${p.category_name || 'No category'} • Stock: ${p.stock} • ₱${parseFloat(p.price || 0).toFixed(2)}`,
              path: '/products',
              id: p.id
            })
          })
        }

        // Search Categories
        const { data: categories } = await categoryService.getAllCategories()
        if (categories) {
          const matchedCategories = categories.filter(c =>
            c.name?.toLowerCase().includes(query)
          ).slice(0, 3)
          
          matchedCategories.forEach(c => {
            results.push({
              type: 'category',
              icon: '📁',
              title: c.name,
              subtitle: `${c.item_count || 0} items`,
              path: `/products?category=${encodeURIComponent(c.name)}`,
              id: c.id
            })
          })
        }

        // Search Customers (Admin only)
        if (isAdmin()) {
          const { data: customers } = await customerService.getAllCustomers()
          if (customers) {
            const matchedCustomers = customers.filter(c =>
              c.name?.toLowerCase().includes(query) ||
              c.email?.toLowerCase().includes(query)
            ).slice(0, 3)
            
            matchedCustomers.forEach(c => {
              results.push({
                type: 'customer',
                icon: '👤',
                title: c.name,
                subtitle: `${c.email} • ${c.status || 'Unknown'}`,
                path: '/customers',
                id: c.id
              })
            })
          }

          // Search Staff (Admin only)
          const { data: staff } = await staffService.getAllStaff()
          if (staff) {
            const matchedStaff = staff.filter(s =>
              s.name?.toLowerCase().includes(query) ||
              s.email?.toLowerCase().includes(query) ||
              s.position?.toLowerCase().includes(query)
            ).slice(0, 3)
            
            matchedStaff.forEach(s => {
              results.push({
                type: 'staff',
                icon: '👨‍💼',
                title: s.name,
                subtitle: `${s.position || 'Staff'} • ${s.email}`,
                path: '/staffs',
                id: s.id
              })
            })
          }
        }

        setSearchResults(results)
        setShowSearchResults(results.length > 0)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }

    // Debounce search
    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, isAdmin])

  const handleSearchResultClick = (result) => {
    setShowSearchResults(false)
    setSearchQuery('')
    navigate(result.path)
  }

  // Fetch notification count for admin and staff
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (isAdmin() || isStaff()) {
        try {
          let count = 0
          
          // Count stock alerts
          const { data: products, error: productsError } = await productService.getAllProducts()
          if (!productsError && products) {
            const stockAlerts = products.filter(p => p.stock === 0 || p.stock <= 2)
            count += stockAlerts.length
          }

          // Count approval requests
          const { data: pendingCustomers, error: customersError } = await customerService.getPendingApprovals()
          if (!customersError && pendingCustomers) {
            count += pendingCustomers.length
          }

          setNotificationCount(count)
        } catch (err) {
          console.error('Error fetching notification count:', err)
        }
      }
    }

    fetchNotificationCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000)
    return () => clearInterval(interval)
  }, [isAdmin, isStaff])

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', isSidebarOpen)
    return () => document.body.classList.remove('sidebar-open')
  }, [isSidebarOpen])

  const navClass = (path) =>
    `ui-nav-link ${isActive(path) ? 'ui-nav-link-active' : ''}`

  return (
    <div className="h-screen w-full bg-gray-800 flex overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 max-w-[85vw] bg-primary-blue flex flex-col z-50 transform transition-transform duration-300 ease-in-out safe-top safe-bottom ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Navigation Links */}
        <div className="flex-1 pt-8 px-6">
          <div className="mb-8 px-1">
            <BrandText size="md" variant="dark" />
          </div>
          <nav className="space-y-4">
            <a 
              href="/home" 
              onClick={(e) => { e.preventDefault(); navigate('/home'); setIsSidebarOpen(false) }}
              className={navClass('/home')}
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-white font-medium">Home</span>
            </a>
            <a  
              href="/products" 
              onClick={(e) => { e.preventDefault(); navigate('/products'); setIsSidebarOpen(false) }}
              className={navClass('/products')}
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-white font-medium">Products</span>
            </a>
            {(isAdmin() || isStaff()) && (
              <a
                href="/reports"
                onClick={(e) => { e.preventDefault(); navigate('/reports'); setIsSidebarOpen(false) }}
                className={navClass('/reports')}
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6h6v6m2 4H7a2 2 0 01-2-2V7a2 2 0 012-2h3l2-2h4l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2z" />
                </svg>
                <span className="text-white font-medium">Reports</span>
              </a>
            )}
            <a 
              href="/categories" 
              onClick={(e) => { e.preventDefault(); navigate('/categories'); setIsSidebarOpen(false) }}
              className={navClass('/categories')}
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-white font-medium">Categories</span>
            </a>
            {isAdmin() && (
              <>
                <a 
                  href="/staffs" 
                  onClick={(e) => { e.preventDefault(); navigate('/staffs'); setIsSidebarOpen(false) }}
                  className={navClass('/staffs')}
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-white font-medium">Staffs</span>
                </a>
                <a 
                  href="/customers" 
                  onClick={(e) => { e.preventDefault(); navigate('/customers'); setIsSidebarOpen(false) }}
                  className={navClass('/customers')}
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-white font-medium">Customers</span>
                </a>
                <a
                  href="/admin"
                  onClick={(e) => { e.preventDefault(); navigate('/admin'); setIsSidebarOpen(false) }}
                  className={navClass('/admin')}
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-white font-medium">Admin</span>
                </a>
              </>
            )}
          </nav>
        </div>
        
        {/* Action Buttons */}
        <div className="px-6 pb-8 space-y-4">
          {(isAdmin() || isStaff()) && (
            <>
              <button
                onClick={() => navigate('/products?sale=1')}
                className="w-full ui-btn bg-green-500 text-white hover:bg-green-600"
              >
                Record Sale
              </button>
              <button
                onClick={() => navigate('/products')}
                className="w-full ui-btn border border-white text-white hover:bg-white hover:text-primary-blue"
              >
                + Add product
              </button>
            </>
          )}
          <button 
            onClick={handleLogout}
            className="w-full ui-btn border border-white text-white hover:bg-white hover:text-primary-blue"
          >
            → Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            <div className="flex-1 md:flex-none min-w-0 truncate">
              <BrandText size="sm" variant="light" />
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 min-w-[44px] min-h-[44px] hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
              aria-label="Search"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Global Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8" ref={searchRef}>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products, categories, customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && searchResults.length > 0 && setShowSearchResults(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue pr-10"
                />
                {isSearching ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}-${index}`}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-2xl">{result.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{result.title}</p>
                          <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          result.type === 'product' ? 'bg-blue-100 text-blue-700' :
                          result.type === 'category' ? 'bg-green-100 text-green-700' :
                          result.type === 'customer' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {result.type}
                        </span>
                      </button>
                    ))}
                    
                    {/* Quick tip */}
                    <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
                      💡 Search across products, categories{isAdmin() ? ', customers, and staff' : ''}
                    </div>
                  </div>
                )}

                {/* No results message */}
                {showSearchResults && searchQuery.trim() && searchResults.length === 0 && !isSearching && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notification Icon - Only for Admin and Staff */}
              {(isAdmin() || isStaff()) && (
                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="p-2 min-w-[44px] min-h-[44px] hover:bg-gray-100 rounded-full transition-colors relative flex items-center justify-center"
                    title="Stock Alerts"
                  >
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {/* Notification badge */}
                    {notificationCount > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                </div>
              )}
              
              {/* Profile/Settings Icon - Visible for all authenticated users */}
              <button 
                onClick={() => navigate('/settings')}
                className="p-2 min-w-[44px] min-h-[44px] hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                title="Profile & Settings"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, categories, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && searchResults.length > 0 && setShowSearchResults(true)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-base"
                id="mobile-search-input"
              />
              <button
                onClick={() => setShowMobileSearch(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {isSearching && (
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border border-primary-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {/* Mobile Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      onClick={() => {
                        handleSearchResultClick(result)
                        setShowMobileSearch(false)
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-2xl">{result.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{result.title}</p>
                        <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        result.type === 'product' ? 'bg-blue-100 text-blue-700' :
                        result.type === 'category' ? 'bg-green-100 text-green-700' :
                        result.type === 'customer' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {result.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 bg-gray-100 overflow-y-auto overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>

    </div>
  )
}

export default Layout

