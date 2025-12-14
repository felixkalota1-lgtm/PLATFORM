/**
 * Workload-Based Theme Configuration
 * Themes change based on user workload intensity (0-100)
 */

export interface WorkloadThemeConfig {
  intensity: number // 0-100
  colors: {
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
  gradients: {
    bg: string
    card: string
    accent: string
  }
  label: string
  description: string
  icon: string
}

/**
 * Get theme based on workload intensity
 * 0-20: Cool Blue (Idle)
 * 20-40: Green (Light work)
 * 40-60: Yellow (Moderate work)
 * 60-80: Orange (Heavy work)
 * 80-100: Red (Critical workload)
 */
export function getWorkloadTheme(intensity: number): WorkloadThemeConfig {
  intensity = Math.max(0, Math.min(100, intensity))

  if (intensity < 20) {
    return {
      intensity,
      colors: {
        primary: '#0EA5E9',
        secondary: '#06B6D4',
        accent: '#0891B2',
        background: '#F0F9FF',
        surface: '#E0F2FE',
        text: '#0C2D48',
        textSecondary: '#164E63',
        border: '#7DD3FC',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      gradients: {
        bg: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #BAE6FD 100%)',
        card: 'linear-gradient(135deg, rgba(224, 242, 254, 0.9) 0%, rgba(186, 230, 253, 0.9) 100%)',
        accent: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
      },
      label: 'Idle',
      description: 'Low activity',
      icon: '❄️',
    }
  }

  if (intensity < 40) {
    return {
      intensity,
      colors: {
        primary: '#22C55E',
        secondary: '#16A34A',
        accent: '#15803D',
        background: '#F0FDF4',
        surface: '#DCFCE7',
        text: '#1B4D2A',
        textSecondary: '#4B5563',
        border: '#86EFAC',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      gradients: {
        bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)',
        card: 'linear-gradient(135deg, rgba(220, 252, 231, 0.9) 0%, rgba(187, 247, 208, 0.9) 100%)',
        accent: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
      },
      label: 'Light',
      description: 'Light workload',
      icon: '🌿',
    }
  }

  if (intensity < 60) {
    return {
      intensity,
      colors: {
        primary: '#EAB308',
        secondary: '#CA8A04',
        accent: '#A16207',
        background: '#FEFCE8',
        surface: '#FEF3C7',
        text: '#663C00',
        textSecondary: '#854D0E',
        border: '#FCD34D',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      gradients: {
        bg: 'linear-gradient(135deg, #FEFCE8 0%, #FEF3C7 50%, #FDE047 100%)',
        card: 'linear-gradient(135deg, rgba(254, 243, 199, 0.9) 0%, rgba(253, 224, 71, 0.9) 100%)',
        accent: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
      },
      label: 'Moderate',
      description: 'Moderate workload',
      icon: '🌞',
    }
  }

  if (intensity < 80) {
    return {
      intensity,
      colors: {
        primary: '#F97316',
        secondary: '#EA580C',
        accent: '#C2410C',
        background: '#FFF7ED',
        surface: '#FFEDD5',
        text: '#5C2A0A',
        textSecondary: '#9A3412',
        border: '#FDBA74',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      gradients: {
        bg: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)',
        card: 'linear-gradient(135deg, rgba(255, 237, 213, 0.9) 0%, rgba(254, 215, 170, 0.9) 100%)',
        accent: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
      },
      label: 'High',
      description: 'Heavy workload',
      icon: '🔥',
    }
  }

  // 80-100: Critical red
  return {
    intensity,
    colors: {
      primary: '#DC2626',
      secondary: '#B91C1C',
      accent: '#991B1B',
      background: '#FEF2F2',
      surface: '#FEE2E2',
      text: '#F5F5F5',
      textSecondary: '#E5E5E5',
      border: '#FCA5A5',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
    },
    gradients: {
      bg: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 50%, #FECACA 100%)',
      card: 'linear-gradient(135deg, rgba(254, 226, 226, 0.9) 0%, rgba(254, 202, 202, 0.9) 100%)',
      accent: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
    },
    label: 'Critical',
    description: 'Critical workload',
    icon: '🚨',
  }
}
