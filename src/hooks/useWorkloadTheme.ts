/**
 * Custom hook for using workload theme
 */

import { useWorkloadTheme } from '../contexts/WorkloadThemeContext'

export const useWorkloadThemeHook = () => {
  const { intensity, theme, isDailyUsageActive, dailyInfo, refreshMetrics } = useWorkloadTheme()

  return {
    intensity,
    theme,
    isDailyUsageActive,
    dailyInfo,
    refreshMetrics,
  }
}
