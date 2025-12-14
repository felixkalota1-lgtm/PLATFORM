/**
 * Weather Theme Display Component
 * Shows current weather, location, and allows manual theme switching
 */

import React from 'react'
import { useWeatherThemeHook } from '../hooks/useWeatherTheme'
import { WeatherCondition } from '../types/weather'
import { Wind, Droplets, RotateCcw, Zap } from 'lucide-react'

export const WeatherThemeDisplay: React.FC = () => {
  const {
    weather,
    loading,
    error,
    refreshWeather,
    setManualWeather,
  } = useWeatherThemeHook()

  const weatherConditions: Array<{ condition: WeatherCondition; label: string; emoji: string }> = [
    { condition: 'sunny', label: 'Sunny', emoji: '☀️' },
    { condition: 'rainy', label: 'Rainy', emoji: '🌧️' },
    { condition: 'snowy', label: 'Snowy', emoji: '❄️' },
    { condition: 'hot', label: 'Hot', emoji: '🔥' },
    { condition: 'cozy', label: 'Cozy', emoji: '🌙' },
  ]

  if (loading && !weather) {
    return (
      <div className="animate-pulse p-4 bg-gray-100 rounded-lg">
        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-32"></div>
      </div>
    )
  }

  if (!weather) {
    return null
  }

  return (
    <div className="space-y-4 p-4 bg-white bg-opacity-90 rounded-lg border border-gray-200 shadow-sm">
      {/* Current Weather Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{weather.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-800">{weather.location}</h3>
              <p className="text-sm text-gray-600">{weather.description}</p>
            </div>
          </div>
          <button
            onClick={refreshWeather}
            disabled={loading}
            className={`p-2 rounded-lg transition-transform ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
            }`}
            title="Refresh weather"
          >
            <RotateCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="p-2 bg-gray-50 rounded">
            <div className="flex justify-center mb-1">
              <Zap size={16} className="text-orange-500" />
            </div>
            <p className="text-gray-600">Temperature</p>
            <p className="font-semibold text-gray-800">{weather.temperature}°C</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="flex justify-center mb-1">
              <Droplets size={16} className="text-blue-500" />
            </div>
            <p className="text-gray-600">Humidity</p>
            <p className="font-semibold text-gray-800">{weather.humidity}%</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="flex justify-center mb-1">
              <Wind size={16} className="text-cyan-500" />
            </div>
            <p className="text-gray-600">Wind Speed</p>
            <p className="font-semibold text-gray-800">{weather.windSpeed} km/h</p>
          </div>
        </div>
      </div>

      {/* Manual Theme Selection */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 block">
          Or choose a theme manually:
        </label>
        <div className="grid grid-cols-5 gap-2">
          {weatherConditions.map(({ condition, label, emoji }) => (
            <button
              key={condition}
              onClick={() => setManualWeather(condition)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                weather.condition === condition
                  ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title={label}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}

export default WeatherThemeDisplay
