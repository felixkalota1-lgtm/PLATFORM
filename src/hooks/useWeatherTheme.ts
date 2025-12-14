/**
 * Custom hook for using weather theme
 */

import { useWeatherTheme } from '../contexts/WeatherThemeContext'
import { WeatherCondition } from '../types/weather'

export const useWeatherThemeHook = () => {
  const { weather, theme, loading, error, refreshWeather, setManualWeather } =
    useWeatherTheme()

  /**
   * Get Tailwind gradient classes based on current theme
   */
  const getGradientClass = () => {
    if (!weather) return 'from-gray-50 to-gray-100'

    const gradientMap: Record<WeatherCondition, string> = {
      sunny: 'from-amber-50 via-yellow-50 to-orange-100',
      rainy: 'from-blue-50 via-cyan-50 to-blue-100',
      snowy: 'from-blue-50 via-cyan-50 to-blue-100',
      hot: 'from-red-50 via-orange-50 to-yellow-100',
      cozy: 'from-amber-50 via-orange-50 to-yellow-100',
    }

    return gradientMap[weather.condition]
  }

  /**
   * Get card background class based on current theme
   */
  const getCardClass = () => {
    if (!weather) return 'bg-white border-gray-200'

    const cardMap: Record<WeatherCondition, string> = {
      sunny:
        'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:border-orange-300',
      rainy:
        'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:border-cyan-300',
      snowy:
        'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 hover:border-blue-300',
      hot: 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:border-red-300',
      cozy: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-orange-300',
    }

    return cardMap[weather.condition]
  }

  /**
   * Get text color class based on current theme
   */
  const getTextClass = () => {
    if (!weather) return 'text-gray-900'

    const textMap: Record<WeatherCondition, string> = {
      sunny: 'text-amber-900',
      rainy: 'text-blue-900',
      snowy: 'text-blue-900',
      hot: 'text-red-900',
      cozy: 'text-amber-900',
    }

    return textMap[weather.condition]
  }

  /**
   * Get accent color class based on current theme
   */
  const getAccentClass = () => {
    if (!weather) return 'bg-blue-500 hover:bg-blue-600'

    const accentMap: Record<WeatherCondition, string> = {
      sunny: 'bg-orange-500 hover:bg-orange-600',
      rainy: 'bg-blue-500 hover:bg-blue-600',
      snowy: 'bg-cyan-500 hover:bg-cyan-600',
      hot: 'bg-red-500 hover:bg-red-600',
      cozy: 'bg-amber-600 hover:bg-amber-700',
    }

    return accentMap[weather.condition]
  }

  /**
   * Get all theme color classes
   */
  const getThemeClasses = () => ({
    gradient: getGradientClass(),
    card: getCardClass(),
    text: getTextClass(),
    accent: getAccentClass(),
    weather: weather?.condition || 'sunny',
    icon: weather?.icon || '☀️',
  })

  return {
    weather,
    theme,
    loading,
    error,
    refreshWeather,
    setManualWeather,
    getGradientClass,
    getCardClass,
    getTextClass,
    getAccentClass,
    getThemeClasses,
  }
}
