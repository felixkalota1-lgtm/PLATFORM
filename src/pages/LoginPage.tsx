import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      return
    }
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    // Save user with tenantId (default for testing)
    localStorage.setItem("pspm_user", JSON.stringify({ 
      email: email.trim(),
      tenantId: 'default',
      role: 'admin',
      id: Date.now().toString()
    }))
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-2 border border-gray-300 rounded" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-2 border border-gray-300 rounded" required />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">{loading ? "..." : "Sign In"}</button>
        </form>
      </div>
    </div>
  )
}