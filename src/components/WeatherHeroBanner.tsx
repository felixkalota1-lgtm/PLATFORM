/**
 * Weather-themed Hero Banner
 * Displays dynamic background and weather info based on current theme
 */

import React from 'react'
import { useWeatherThemeHook } from '../hooks/useWeatherTheme'

interface WeatherHeroBannerProps {
  title?: string
  subtitle?: string
  showWeatherInfo?: boolean
  height?: 'sm' | 'md' | 'lg'
}

export const WeatherHeroBanner: React.FC<WeatherHeroBannerProps> = ({
  title = 'Welcome',
  subtitle,
  showWeatherInfo = true,
  height = 'md',
}) => {
  const { weather, getGradientClass } = useWeatherThemeHook()

  const heightMap = {
    sm: 'h-32',
    md: 'h-48',
    lg: 'h-64',
  }

  const getAnimationClass = () => {
    if (!weather) return ''

    const animations: Record<string, string> = {
      sunny: 'animate-pulse',
      rainy: 'animate-bounce',
      snowy: 'animate-bounce',
      hot: 'animate-pulse',
      cozy: 'animate-pulse',
    }

    return animations[weather.condition] || ''
  }

  const getPatternOverlay = () => {
    if (!weather) return ''

    switch (weather.condition) {
      case 'sunny':
        return 'radial-gradient(circle at 20% 50%, rgba(255,255,0,0.1), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,165,0,0.1), transparent 50%)'
      case 'rainy':
        return 'linear-gradient(45deg, rgba(100,149,237,0.1) 25%, transparent 25%, transparent 50%, rgba(100,149,237,0.1) 50%, rgba(100,149,237,0.1) 75%, transparent 75%, transparent)'
      case 'snowy':
        return 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)'
      case 'hot':
        return 'repeating-linear-gradient(90deg, rgba(255,165,0,0.1), rgba(255,165,0,0.1) 10px, transparent 10px, transparent 20px)'
      case 'cozy':
        return 'radial-gradient(circle at 50% 50%, rgba(139,69,19,0.1), transparent 60%)'
      default:
        return ''
    }
  }

  return (
    <div
      className={`${heightMap[height]} bg-gradient-to-br ${getGradientClass()} rounded-lg overflow-hidden relative`}
      style={{
        background: `linear-gradient(135deg, var(--color-background) 0%, var(--color-surface) 100%)`,
      }}
    >
      {/* Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: getPatternOverlay(),
          backgroundSize: height === 'lg' ? '40px 40px' : '30px 30px',
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 space-y-3">
        {/* Weather Icon */}
        {showWeatherInfo && weather && (
          <div className={`text-5xl ${getAnimationClass()}`}>
            {weather.icon}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text)' }}>
          {title}
        </h1>

        {/* Subtitle or Weather Info */}
        {subtitle ? (
          <p
            className="text-lg"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {subtitle}
          </p>
        ) : showWeatherInfo && weather ? (
          <p
            className="text-lg"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {weather.location} • {weather.temperature}°C • {weather.description}
          </p>
        ) : null}
      </div>

      {/* Decorative Gradient Border */}
      <div
        className="absolute inset-0 pointer-events-none border-2 rounded-lg opacity-0 hover:opacity-20 transition-opacity"
        style={{
          borderColor: 'var(--color-primary)',
        }}
      />
    </div>
  )
}

export default WeatherHeroBanner
