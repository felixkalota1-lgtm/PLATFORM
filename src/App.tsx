import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import Toaster from './components/Toaster'
import { useEffect, useState } from 'react'

function AppRoutes() {
  const currentUser = useAppStore((state) => state.currentUser)

  console.log('AppRoutes rendering, currentUser:', currentUser)

  if (currentUser) {
    console.log('User is logged in, showing Layout')
    return <Layout />
  } else {
    console.log('User is NOT logged in, showing LoginPage')
    return <LoginPage />
  }
}

function App() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-full h-screen flex items-center justify-center bg-white">Loading...</div>
  }

  return (
    <Router>
      <Toaster />
      <AppRoutes />
    </Router>
  )
}

export default App
