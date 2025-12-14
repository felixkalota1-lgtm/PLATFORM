/**
 * Weather and Theme Types
 */

export type WeatherCondition = 'sunny' | 'rainy' | 'snowy' | 'hot' | 'cozy'

export interface WeatherData {
  condition: WeatherCondition
  temperature: number
  location: string
  humidity: number
  windSpeed: number
  description: string
  icon: string
}

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  danger: string
  info: string
}

export interface ThemeConfig {
  condition: WeatherCondition
  colors: ThemeColors
  gradients: {
    bg: string
    card: string
    accent: string
  }
  icons: {
    weather: string
    primary: string
  }
  animations: {
    duration: 'fast' | 'normal' | 'slow'
    intensity: 'subtle' | 'normal' | 'dramatic'
  }
}

export interface LocationCoordinates {
  latitude: number
  longitude: number
}
