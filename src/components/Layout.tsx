import { useState, ReactNode } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import ManagerAIAssistant from './ManagerAIAssistant'
import { useWorkloadTheme } from '../contexts/WorkloadThemeContext'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { theme, intensity } = useWorkloadTheme()

  return (
    <div 
      className="flex h-screen" 
      key={intensity}
      style={{
        background: theme.gradients.bg,
        color: theme.colors.text,
        transition: 'background 0.5s ease-in-out, color 0.5s ease-in-out'
      }}
    >
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main 
          className="flex-1 overflow-auto" 
          style={{
            background: theme.gradients.bg,
            color: theme.colors.text,
            transition: 'background 0.5s ease-in-out, color 0.5s ease-in-out'
          }}
        >
          {children}
        </main>
      </div>
      <ManagerAIAssistant visible={true} />
    </div>
  )
}
