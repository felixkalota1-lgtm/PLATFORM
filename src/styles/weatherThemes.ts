/**
 * Weather Theme Configuration
 * Defines color schemes and animations for each weather condition
 */

import { WeatherCondition, ThemeConfig } from '../types/weather'

export const weatherThemes: Record<WeatherCondition, ThemeConfig> = {
  sunny: {
    condition: 'sunny',
    colors: {
      primary: '#FFA500',
      secondary: '#FFD700',
      accent: '#FF8C00',
      background: '#FFF8DC',
      surface: '#FFFACD',
      text: '#333333',
      textSecondary: '#666666',
      border: '#FFE4B5',
      success: '#32CD32',
      warning: '#FF6347',
      danger: '#DC143C',
      info: '#1E90FF',
    },
    gradients: {
      bg: 'linear-gradient(135deg, #FFF8DC 0%, #FFFACD 50%, #FFE4B5 100%)',
      card: 'linear-gradient(135deg, rgba(255, 250, 205, 0.8) 0%, rgba(255, 228, 181, 0.8) 100%)',
      accent: 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)',
    },
    icons: {
      weather: '☀️',
      primary: '🌞',
    },
    animations: {
      duration: 'normal',
      intensity: 'normal',
    },
  },

  rainy: {
    condition: 'rainy',
    colors: {
      primary: '#4A90E2',
      secondary: '#357ABD',
      accent: '#2C5AA0',
      background: '#E8F4F8',
      surface: '#D5E8F0',
      text: '#1A3A45',
      textSecondary: '#4A6B7C',
      border: '#B0CCD9',
      success: '#27AE60',
      warning: '#E67E22',
      danger: '#C0392B',
      info: '#3498DB',
    },
    gradients: {
      bg: 'linear-gradient(135deg, #E8F4F8 0%, #D5E8F0 50%, #B0CCD9 100%)',
      card: 'linear-gradient(135deg, rgba(213, 232, 240, 0.9) 0%, rgba(176, 204, 217, 0.9) 100%)',
      accent: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
    },
    icons: {
      weather: '🌧️',
      primary: '💧',
    },
    animations: {
      duration: 'slow',
      intensity: 'subtle',
    },
  },

  snowy: {
    condition: 'snowy',
    colors: {
      primary: '#B0E0E6',
      secondary: '#87CEEB',
      accent: '#4FC3F7',
      background: '#F0F8FF',
      surface: '#E0F6FF',
      text: '#0D47A1',
      textSecondary: '#1565C0',
      border: '#81D4FA',
      success: '#00BCD4',
      warning: '#FF9800',
      danger: '#F44336',
      info: '#2196F3',
    },
    gradients: {
      bg: 'linear-gradient(135deg, #F0F8FF 0%, #E0F6FF 50%, #81D4FA 100%)',
      card: 'linear-gradient(135deg, rgba(224, 246, 255, 0.95) 0%, rgba(129, 212, 250, 0.95) 100%)',
      accent: 'linear-gradient(135deg, #B0E0E6 0%, #87CEEB 100%)',
    },
    icons: {
      weather: '❄️',
      primary: '⛄',
    },
    animations: {
      duration: 'fast',
      intensity: 'dramatic',
    },
  },

  hot: {
    condition: 'hot',
    colors: {
      primary: '#FF4500',
      secondary: '#FF6347',
      accent: '#FF7F50',
      background: '#FFE4E1',
      surface: '#FFF0F5',
      text: '#8B0000',
      textSecondary: '#CD5C5C',
      border: '#FFB6C1',
      success: '#FF1493',
      warning: '#FF69B4',
      danger: '#DC143C',
      info: '#FF8C00',
    },
    gradients: {
      bg: 'linear-gradient(135deg, #FFE4E1 0%, #FFF0F5 50%, #FFB6C1 100%)',
      card: 'linear-gradient(135deg, rgba(255, 240, 245, 0.9) 0%, rgba(255, 182, 193, 0.9) 100%)',
      accent: 'linear-gradient(135deg, #FF4500 0%, #FF6347 100%)',
    },
    icons: {
      weather: '🔥',
      primary: '☀️',
    },
    animations: {
      duration: 'fast',
      intensity: 'dramatic',
    },
  },

  cozy: {
    condition: 'cozy',
    colors: {
      primary: '#8B4513',
      secondary: '#A0522D',
      accent: '#D2691E',
      background: '#FFF8DC',
      surface: '#FFE4B5',
      text: '#3E2723',
      textSecondary: '#5D4037',
      border: '#DEB887',
      success: '#6B8E23',
      warning: '#DC143C',
      danger: '#8B0000',
      info: '#4169E1',
    },
    gradients: {
      bg: 'linear-gradient(135deg, #FFF8DC 0%, #FFE4B5 50%, #DEB887 100%)',
      card: 'linear-gradient(135deg, rgba(255, 228, 181, 0.95) 0%, rgba(222, 184, 135, 0.95) 100%)',
      accent: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
    },
    icons: {
      weather: '🌙',
      primary: '🏠',
    },
    animations: {
      duration: 'slow',
      intensity: 'subtle',
    },
  },
}

/**
 * Generate CSS variables for a theme
 */
export const generateThemeCSS = (theme: ThemeConfig): string => {
  return `
    :root {
      --color-primary: ${theme.colors.primary};
      --color-secondary: ${theme.colors.secondary};
      --color-accent: ${theme.colors.accent};
      --color-background: ${theme.colors.background};
      --color-surface: ${theme.colors.surface};
      --color-text: ${theme.colors.text};
      --color-text-secondary: ${theme.colors.textSecondary};
      --color-border: ${theme.colors.border};
      --color-success: ${theme.colors.success};
      --color-warning: ${theme.colors.warning};
      --color-danger: ${theme.colors.danger};
      --color-info: ${theme.colors.info};
      
      --gradient-bg: ${theme.gradients.bg};
      --gradient-card: ${theme.gradients.card};
      --gradient-accent: ${theme.gradients.accent};
      
      --animation-duration: ${theme.animations.duration === 'fast' ? '0.2s' : theme.animations.duration === 'slow' ? '0.8s' : '0.5s'};
      --animation-intensity: ${theme.animations.intensity === 'subtle' ? '0.3' : theme.animations.intensity === 'dramatic' ? '1' : '0.6'};
    }
  `.trim()
}

/**
 * Get Tailwind color classes based on theme
 */
export const getThemeClasses = (
  baseClass: string,
  _theme: ThemeConfig
): Record<WeatherCondition, string> => {
  const themeColorMap: Record<WeatherCondition, string> = {
    sunny: 'from-amber-50 to-yellow-100',
    rainy: 'from-blue-50 to-cyan-100',
    snowy: 'from-blue-50 to-cyan-100',
    hot: 'from-red-50 to-orange-100',
    cozy: 'from-amber-50 to-orange-100',
  }

  return {
    sunny: `${baseClass} ${themeColorMap.sunny}`,
    rainy: `${baseClass} ${themeColorMap.rainy}`,
    snowy: `${baseClass} ${themeColorMap.snowy}`,
    hot: `${baseClass} ${themeColorMap.hot}`,
    cozy: `${baseClass} ${themeColorMap.cozy}`,
  }
}
