import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import OfflineIndicator from './components/OfflineIndicator'
import InstallApp from './components/InstallApp'
import { isElectron } from './utils/isElectron'
import LandingPage from './components/LandingPage'
import Signup from './components/Signup'
import Login from './components/Login'
import Home from './components/Home'
import Products from './components/Products'
import Categories from './components/Categories'
import Staffs from './components/Staffs'
import Customers from './components/Customers'
import Settings from './components/Settings'
import Reports from './components/Reports'
import Admin from './components/Admin'
import ProtectedRoute from './components/ProtectedRoute'
//Dre
function AuthWrapper({ children }) {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {children}
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  return (
    <AuthWrapper>
      <Login onToggle={() => navigate('/signup')} />
    </AuthWrapper>
  )
}

function SignupPage() {
  const navigate = useNavigate()
  return (
    <AuthWrapper>
      <Signup onToggle={() => navigate('/login')} />
    </AuthWrapper>
  )
}

function App() {
  return (
    <AuthProvider>
      {!isElectron() && <OfflineIndicator />}
      {!isElectron() && <InstallApp variant="banner" />}
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/products" 
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/categories" 
            element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staffs" 
            element={
              <ProtectedRoute adminOnly={true}>
                <Staffs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customers" 
            element={
              <ProtectedRoute adminOnly={true}>
                <Customers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

