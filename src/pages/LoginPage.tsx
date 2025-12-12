import { Mail, Lock, Building2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { setCurrentUser, setCurrentCompany } = useAppStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleLogin started')
    
    // Validation
    if (!email.trim() || !password.trim() || !companyCode.trim()) {
      console.log('Validation failed - missing fields')
      toast.error('Please fill in all fields')
      return
    }

    console.log('Validation passed, starting login...')
    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      console.log('API call simulated')
      
      // Set user data
      const newUser = {
        id: 'user_' + Date.now(),
        email: email.trim(),
        companyId: companyCode.trim(),
        role: 'admin' as const,
        permissions: ['read', 'write', 'delete'],
        createdAt: new Date(),
      }
      
      const newCompany = {
        id: companyCode.trim(),
        name: `Company - ${companyCode}`,
        registrationNumber: `REG-${companyCode.toUpperCase()}`,
        industry: 'Retail/Trading',
        address: '123 Business Street',
        phone: '+1 (555) 123-4567',
        email: email.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      console.log('About to call setCurrentUser with:', newUser)
      setCurrentUser(newUser)
      console.log('setCurrentUser called')
      
      console.log('About to call setCurrentCompany with:', newCompany)
      setCurrentCompany(newCompany)
      console.log('setCurrentCompany called')
      
      toast.success('Login successful!')
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!email.trim() || !password.trim() || !companyCode.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      // Set user data for new registration
      const newUser = {
        id: 'user_' + Date.now(),
        email: email.trim(),
        companyId: companyCode.trim(),
        role: 'admin' as const,
        permissions: ['read', 'write', 'delete'],
        createdAt: new Date(),
      }
      
      const newCompany = {
        id: companyCode.trim(),
        name: `Company - ${companyCode}`,
        registrationNumber: `REG-${companyCode.toUpperCase()}`,
        industry: 'Retail/Trading',
        address: '123 Business Street',
        phone: '+1 (555) 123-4567',
        email: email.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      setCurrentUser(newUser)
      setCurrentCompany(newCompany)
      
      toast.success('Registration successful! Welcome aboard!')
    } catch (error) {
      console.error('Register error:', error)
      toast.error('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    console.log('handleSubmit called! isRegistering:', isRegistering)
    if (isRegistering) {
      handleRegister(e)
    } else {
      handleLogin(e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-600 text-white rounded-lg px-4 py-2 mb-4">
            <h1 className="text-2xl font-bold">PSPM</h1>
          </div>
          <p className="text-gray-600 text-sm">Platform Sales & Procurement Marketplace</p>
          <p className="text-gray-500 text-xs mt-2">
            {isRegistering ? 'Create a new account' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Code
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="e.g., ABC123"
                disabled={loading}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Unique identifier for your company</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="you@company.com"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isRegistering ? 'Creating account...' : 'Signing in...'}
              </span>
            ) : (
              isRegistering ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 font-semibold disabled:text-gray-400 transition"
            >
              {isRegistering ? 'Sign In' : 'Register Here'}
            </button>
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <span className="font-semibold">Demo Mode:</span> Enter any email and company code to test the platform
          </p>
        </div>
      </div>
    </div>
  )
}
