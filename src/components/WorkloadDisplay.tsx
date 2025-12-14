/**
 * Workload Display Component
 * Shows current workload intensity and daily usage stats
 */

import React from 'react'
import { useWorkloadTheme } from '../contexts/WorkloadThemeContext'
import { RotateCcw } from 'lucide-react'

export const WorkloadDisplay: React.FC = () => {
  const { intensity, theme, isDailyUsageActive, dailyInfo, refreshMetrics } = useWorkloadTheme()

  const getIntensityLabel = (intensity: number): string => {
    if (intensity < 20) return 'Idle'
    if (intensity < 40) return 'Light'
    if (intensity < 60) return 'Moderate'
    if (intensity < 80) return 'Heavy'
    return 'Critical'
  }

  const getProgressColor = (intensity: number): string => {
    if (intensity < 20) return '#0EA5E9'
    if (intensity < 40) return '#22C55E'
    if (intensity < 60) return '#EAB308'
    if (intensity < 80) return '#F97316'
    return '#DC2626'
  }

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm"
      style={{
        background: theme.colors.background,
        borderColor: theme.colors.border,
        borderWidth: '1px'
      }}
    >
      {/* Intensity Indicator */}
      <div className="flex items-center gap-1.5">
        <span style={{ fontSize: '14px' }}>{theme.icon}</span>
        <div className="flex flex-col gap-0.5">
          <span 
            className="text-xs font-bold"
            style={{ color: theme.colors.text, lineHeight: '1' }}
          >
            {intensity}/100
          </span>
          <span 
            className="text-xs"
            style={{ color: theme.colors.textSecondary, lineHeight: '1' }}
          >
            {getIntensityLabel(intensity)}
          </span>
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div 
        className="w-12 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: theme.colors.border }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${intensity}%`,
            background: getProgressColor(intensity),
          }}
        />
      </div>

      {/* Work Status Badge */}
      <span 
        className="text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
        style={{
          background: isDailyUsageActive ? theme.colors.success : theme.colors.danger,
          color: '#fff',
          fontSize: '10px'
        }}
      >
        {dailyInfo.hoursWorked}h
      </span>

      {/* Refresh Button */}
      <button
        onClick={refreshMetrics}
        className="p-1 rounded transition-transform hover:opacity-70"
        style={{ color: theme.colors.primary }}
        title="Refresh metrics"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  )
}

export default WorkloadDisplay
