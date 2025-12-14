import React, { createContext, useContext, useState, useEffect } from 'react'

export interface WorkSettings {
  workStartHour: number // 0-23
  workEndHour: number // 0-23
  timezone: string // IANA timezone string or 'auto' for browser timezone
}

const defaultSettings: WorkSettings = {
  workStartHour: 8,
  workEndHour: 18,
  timezone: 'auto',
}

interface SettingsContextType {
  settings: WorkSettings
  updateSettings: (settings: Partial<WorkSettings>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WorkSettings>(defaultSettings)
  const [loaded, setLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('workSettings')
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved)
        setSettings({ ...defaultSettings, ...parsedSettings })
      } catch (e) {
        console.warn('Failed to parse saved settings:', e)
        setSettings(defaultSettings)
      }
    }
    setLoaded(true)
  }, [])

  const updateSettings = (newSettings: Partial<WorkSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem('workSettings', JSON.stringify(updated))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem('workSettings')
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
