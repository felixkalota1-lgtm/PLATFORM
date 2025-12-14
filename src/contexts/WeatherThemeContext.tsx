/**
 * Weather Theme Context
 * Provides weather data and theme configuration to the entire app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { WeatherData, ThemeConfig } from '../types/weather'
import {
  getLocationFromIP,
  getWeatherDataCached,
} from '../services/weatherService'
import { weatherThemes } from '../styles/weatherThemes'

interface WeatherThemeContextType {
  weather: WeatherData | null
  theme: ThemeConfig | null
  loading: boolean
  error: string | null
  refreshWeather: () => Promise<void>
  setManualWeather: (condition: WeatherData['condition']) => void
}

const WeatherThemeContext = createContext<WeatherThemeContextType | undefined>(undefined)

interface WeatherThemeProviderProps {
  children: ReactNode
}

export const WeatherThemeProvider: React.FC<WeatherThemeProviderProps> = ({ children }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user's location
      const location = await getLocationFromIP()

      // Fetch weather data
      const weatherData = await getWeatherDataCached(location.latitude, location.longitude)
      setWeather(weatherData)

      // Store in localStorage for persistence
      localStorage.setItem('pspm_weather', JSON.stringify(weatherData))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather'
      setError(errorMessage)
      console.error('Weather fetch error:', err)

      // Try to load from cache
      const cached = localStorage.getItem('pspm_weather')
      if (cached) {
        try {
          setWeather(JSON.parse(cached))
          setError(null)
        } catch {
          setWeather({
            condition: 'sunny',
            temperature: 20,
            location: 'Unknown',
            humidity: 50,
            windSpeed: 0,
            description: 'Unable to fetch weather',
            icon: '☀️',
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch weather on mount
    fetchWeather()

    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Apply theme CSS when weather changes
  useEffect(() => {
    if (weather) {
      const theme = weatherThemes[weather.condition]
      applyTheme(theme)
    }
  }, [weather])

  const refreshWeather = async () => {
    await fetchWeather()
  }

  const setManualWeather = (condition: WeatherData['condition']) => {
    if (weather) {
      const updatedWeather = { ...weather, condition }
      setWeather(updatedWeather)
      localStorage.setItem('pspm_weather', JSON.stringify(updatedWeather))
    }
  }

  const theme = weather ? weatherThemes[weather.condition] : null

  return (
    <WeatherThemeContext.Provider
      value={{
        weather,
        theme,
        loading,
        error,
        refreshWeather,
        setManualWeather,
      }}
    >
      {children}
    </WeatherThemeContext.Provider>
  )
}

export const useWeatherTheme = (): WeatherThemeContextType => {
  const context = useContext(WeatherThemeContext)
  if (!context) {
    throw new Error('useWeatherTheme must be used within WeatherThemeProvider')
  }
  return context
}

/**
 * Apply theme CSS to document
 */
function applyTheme(theme: ThemeConfig) {
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
  root.style.setProperty('--color-success', colors.success)
  root.style.setProperty('--color-warning', colors.warning)
  root.style.setProperty('--color-danger', colors.danger)
  root.style.setProperty('--color-info', colors.info)

  // Set animation properties
  const duration =
    theme.animations.duration === 'fast' ? '0.2s' : theme.animations.duration === 'slow' ? '0.8s' : '0.5s'
  const intensity =
    theme.animations.intensity === 'subtle' ? '0.3' : theme.animations.intensity === 'dramatic' ? '1' : '0.6'

  root.style.setProperty('--animation-duration', duration)
  root.style.setProperty('--animation-intensity', intensity)

  // Update body background gradient
  document.body.style.background = theme.gradients.bg
  document.body.style.transition = `background 0.5s ease-in-out`

  // Update meta theme color for browser UI
  let metaTheme = document.querySelector('meta[name="theme-color"]')
  if (!metaTheme) {
    metaTheme = document.createElement('meta')
    metaTheme.setAttribute('name', 'theme-color')
    document.head.appendChild(metaTheme)
  }
  metaTheme.setAttribute('content', colors.primary)
}
