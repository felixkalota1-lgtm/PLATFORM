/**
 * Workload Theme Context
 * Provides workload-based theming to the entire app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { workloadService } from '../services/workloadService'
import { getWorkloadTheme, WorkloadThemeConfig } from '../styles/workloadThemes'
import { useSettings } from './SettingsContext'

interface WorkloadThemeContextType {
  intensity: number
  theme: WorkloadThemeConfig
  isDailyUsageActive: boolean
  dailyInfo: any
  refreshMetrics: () => void
}

const WorkloadThemeContext = createContext<WorkloadThemeContextType | undefined>(undefined)

interface WorkloadThemeProviderProps {
  children: ReactNode
}

export const WorkloadThemeProvider: React.FC<WorkloadThemeProviderProps> = ({ children }) => {
  const { settings } = useSettings()
  const [intensity, setIntensity] = useState(0)
  const [theme, setTheme] = useState<WorkloadThemeConfig>(getWorkloadTheme(0))
  const [dailyInfo, setDailyInfo] = useState(workloadService.getDailyUsageInfo())

  // Update theme on demand only (no automatic refresh to prevent data loss)
  useEffect(() => {
    // Initial theme load only
    const currentIntensity = workloadService.calculateIntensity(settings.workStartHour, settings.workEndHour)
    setIntensity(currentIntensity)
    setTheme(getWorkloadTheme(currentIntensity))
    setDailyInfo(workloadService.getDailyUsageInfo())
    applyTheme(getWorkloadTheme(currentIntensity))
  }, [settings.workStartHour, settings.workEndHour])

  const refreshMetrics = () => {
    const currentIntensity = workloadService.calculateIntensity(settings.workStartHour, settings.workEndHour)
    setIntensity(currentIntensity)
    setTheme(getWorkloadTheme(currentIntensity))
  }

  const isDailyUsageActive = dailyInfo.isActiveHours

  return (
    <WorkloadThemeContext.Provider
      value={{
        intensity,
        theme,
        isDailyUsageActive,
        dailyInfo,
        refreshMetrics,
      }}
    >
      {children}
    </WorkloadThemeContext.Provider>
  )
}

export const useWorkloadTheme = (): WorkloadThemeContextType => {
  const context = useContext(WorkloadThemeContext)
  if (!context) {
    throw new Error('useWorkloadTheme must be used within WorkloadThemeProvider')
  }
  return context
}

/**
 * Apply theme CSS to document
 */
function applyTheme(theme: WorkloadThemeConfig) {
  const root = document.documentElement
  const colors = theme.colors

  // Set CSS custom properties for colors
  root.style.setProperty('--color-primary', colors.primary)
  root.style.setProperty('--color-secondary', colors.secondary)
  root.style.setProperty('--color-accent', colors.accent)
  root.style.setProperty('--color-background', colors.background)
  root.style.setProperty('--color-surface', colors.surface)
  root.style.setProperty('--color-text', colors.text)
  root.style.setProperty('--color-text-secondary', colors.textSecondary)
  root.style.setProperty('--color-border', colors.border)

  // Update body background gradient
  document.body.style.background = theme.gradients.bg
  document.body.style.transition = `background 0.5s ease-in-out`
  document.body.style.color = colors.text

  // Update meta theme color
  let metaTheme = document.querySelector('meta[name="theme-color"]')
  if (!metaTheme) {
    metaTheme = document.createElement('meta')
    metaTheme.setAttribute('name', 'theme-color')
    document.head.appendChild(metaTheme)
  }
  metaTheme.setAttribute('content', colors.primary)
}
