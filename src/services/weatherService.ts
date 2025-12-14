/**
 * Weather Service - Detects location and fetches weather data
 * Uses Open-Meteo API (free, no API key required)
 */

import { WeatherData, WeatherCondition, LocationCoordinates } from '../types/weather'

const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search'

export const getLocationFromIP = async (): Promise<LocationCoordinates> => {
  try {
    // Try using Geolocation API first (requires user permission)
    return await new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          },
          (error) => {
            console.log('Geolocation permission denied, falling back to IP-based location')
            reject(error)
          }
        )
      } else {
        reject(new Error('Geolocation not supported'))
      }
    })
  } catch (error) {
    // Fallback to IP-based location using ip-api (free tier available)
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      return {
        latitude: data.latitude,
        longitude: data.longitude,
      }
    } catch (fallbackError) {
      console.error('Failed to get location:', fallbackError)
      // Default to a central location if all methods fail
      return {
        latitude: 0,
        longitude: 0,
      }
    }
  }
}

export const getLocationName = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const response = await fetch(
      `${GEOCODING_API}?latitude=${latitude}&longitude=${longitude}&limit=1`
    )
    const data = await response.json()
    if (data.results && data.results[0]) {
      const result = data.results[0]
      return `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}${
        result.country ? ', ' + result.country : ''
      }`
    }
    return 'Unknown Location'
  } catch (error) {
    console.error('Failed to get location name:', error)
    return 'Unknown Location'
  }
}

export const getWeatherData = async (
  latitude: number,
  longitude: number
): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${OPEN_METEO_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh`
    )
    const data = await response.json()
    const current = data.current

    // Get location name
    const location = await getLocationName(latitude, longitude)

    // Map WMO weather codes to our weather conditions
    const condition = getWeatherCondition(current.weather_code, current.temperature_2m)

    return {
      condition,
      temperature: Math.round(current.temperature_2m),
      location,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      description: getWeatherDescription(current.weather_code),
      icon: getWeatherIcon(condition),
    }
  } catch (error) {
    console.error('Failed to fetch weather data:', error)
    // Return default weather data
    return {
      condition: 'sunny',
      temperature: 20,
      location: 'Unknown',
      humidity: 50,
      windSpeed: 0,
      description: 'Unable to fetch weather',
      icon: '☀️',
    }
  }
}

/**
 * Maps WMO weather codes to our weather conditions
 * WMO codes: https://www.open-meteo.com/en/docs
 */
function getWeatherCondition(code: number, temperature: number): WeatherCondition {
  // Clear sky (0), Mainly clear (1), Partly cloudy (2)
  if ([0, 1, 2].includes(code)) {
    return temperature > 25 ? 'hot' : 'sunny'
  }

  // Overcast (3)
  if (code === 3) {
    return temperature < 5 ? 'cozy' : 'sunny'
  }

  // Fog, depositing rime fog (45, 48)
  if ([45, 48].includes(code)) {
    return 'cozy'
  }

  // Drizzle (51, 53, 55)
  if ([51, 53, 55].includes(code)) {
    return 'rainy'
  }

  // Rain (61, 63, 65, 80, 81, 82)
  if ([61, 63, 65, 80, 81, 82].includes(code)) {
    return 'rainy'
  }

  // Snow (71, 73, 75, 77, 85, 86)
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return 'snowy'
  }

  // Thunderstorm (80, 81, 82, 85, 86)
  if ([80, 81, 82, 85, 86].includes(code)) {
    return 'rainy'
  }

  // Default
  return temperature > 25 ? 'hot' : 'sunny'
}

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy with rime',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
  }
  return descriptions[code] || 'Unknown'
}

function getWeatherIcon(condition: WeatherCondition): string {
  const icons: Record<WeatherCondition, string> = {
    sunny: '☀️',
    rainy: '🌧️',
    snowy: '❄️',
    hot: '🔥',
    cozy: '🌙',
  }
  return icons[condition]
}

/**
 * Cache weather data to avoid excessive API calls
 */
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes
let cachedWeather: WeatherData | null = null
let cacheTimestamp = 0

export const getWeatherDataCached = async (
  latitude: number,
  longitude: number
): Promise<WeatherData> => {
  const now = Date.now()
  if (
    cachedWeather &&
    cacheTimestamp &&
    now - cacheTimestamp < CACHE_DURATION
  ) {
    return cachedWeather
  }

  const weather = await getWeatherData(latitude, longitude)
  cachedWeather = weather
  cacheTimestamp = now
  return weather
}
