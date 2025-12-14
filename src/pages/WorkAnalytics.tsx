import { useState, useEffect } from 'react'
import { useWorkloadTheme } from '../contexts/WorkloadThemeContext'
import { analyticsService, ActivityMetrics, WeeklyStats } from '../services/analyticsService'
import { TrendingUp, Calendar, Zap, Target, Award } from 'lucide-react'

export default function AnalyticsDashboard() {
  const { theme } = useWorkloadTheme()
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null)
  const [thisWeek, setThisWeek] = useState<WeeklyStats | null>(null)
  const [lastWeek, setLastWeek] = useState<WeeklyStats | null>(null)

  useEffect(() => {
    const loadData = () => {
      const m = analyticsService.getActivityMetrics()
      const tw = analyticsService.getThisWeekData()
      const lw = analyticsService.getLastWeekData()

      setMetrics(m)
      setThisWeek(tw)
      setLastWeek(lw)
    }

    loadData()
    // Refresh every minute
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!metrics || !thisWeek || !lastWeek) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ background: theme.gradients.bg }}>
        <p style={{ color: theme.colors.text }}>Loading analytics...</p>
      </div>
    )
  }

  const badge = analyticsService.getPerformanceBadge(metrics)
  const weekComparison = metrics.thisWeekHours - metrics.lastWeekHours
  const weekComparisonPercent = metrics.lastWeekHours > 0 ? Math.round((weekComparison / metrics.lastWeekHours) * 100) : 0

  return (
    <div className="min-h-screen p-6" style={{ background: theme.gradients.bg, color: theme.colors.text }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.text }}>
            📊 Work Analytics & Performance
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Track your productivity and work patterns over time
          </p>
        </div>

        {/* Performance Badge */}
        <div
          className="mb-8 p-6 rounded-lg border-2 flex items-center gap-6"
          style={{
            background: theme.colors.background,
            borderColor: theme.colors.border,
          }}
        >
          <div className="text-6xl">{badge.emoji}</div>
          <div>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              Performance Level
            </p>
            <p className="text-3xl font-bold mb-2" style={{ color: theme.colors.primary }}>
              {badge.label}
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-full bg-gray-300 rounded-full h-3 max-w-xs"
                style={{ background: theme.colors.border }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.productivityScore}%`,
                    background: `linear-gradient(90deg, #0EA5E9, #DC2626)`,
                  }}
                />
              </div>
              <span className="font-bold text-lg">{metrics.productivityScore}/100</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Hours */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              background: theme.colors.background,
              borderColor: theme.colors.border,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar size={24} style={{ color: theme.colors.primary }} />
              <h3 className="font-semibold">Total Hours</h3>
            </div>
            <p className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
              {metrics.totalHoursWorked}h
            </p>
            <p className="text-xs mt-2" style={{ color: theme.colors.textSecondary }}>
              {metrics.totalDaysTracked} days tracked
            </p>
          </div>

          {/* Average Daily */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              background: theme.colors.background,
              borderColor: theme.colors.border,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Target size={24} style={{ color: theme.colors.accent }} />
              <h3 className="font-semibold">Avg Daily</h3>
            </div>
            <p className="text-3xl font-bold" style={{ color: theme.colors.accent }}>
              {metrics.averageHoursPerDay}h
            </p>
            <p className="text-xs mt-2" style={{ color: theme.colors.textSecondary }}>
              Per working day
            </p>
          </div>

          {/* Longest Streak */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              background: theme.colors.background,
              borderColor: theme.colors.border,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap size={24} style={{ color: theme.colors.warning }} />
              <h3 className="font-semibold">Streak</h3>
            </div>
            <p className="text-3xl font-bold" style={{ color: theme.colors.warning }}>
              {metrics.longestStreak}d
            </p>
            <p className="text-xs mt-2" style={{ color: theme.colors.textSecondary }}>
              Best streak
            </p>
          </div>

          {/* Week Comparison */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              background: theme.colors.background,
              borderColor: theme.colors.border,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={24} style={{ color: weekComparison >= 0 ? theme.colors.success : theme.colors.danger }} />
              <h3 className="font-semibold">Week vs Week</h3>
            </div>
            <p
              className="text-3xl font-bold"
              style={{ color: weekComparison >= 0 ? theme.colors.success : theme.colors.danger }}
            >
              {weekComparison >= 0 ? '+' : ''}{weekComparison}h
            </p>
            <p className="text-xs mt-2" style={{ color: theme.colors.textSecondary }}>
              {weekComparisonPercent >= 0 ? '+' : ''}{weekComparisonPercent}% vs last week
            </p>
          </div>
        </div>

        {/* Weekly Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* This Week */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              background: theme.colors.background,
              borderColor: theme.colors.border,
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: theme.colors.text }}>
              📅 This Week
            </h2>
            <div className="space-y-3">
              {thisWeek.records.map((record) => (
                <div key={record.date} className="flex items-center gap-4">
                  <div className="min-w-24 text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>
                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div
                    className="flex-1 h-8 rounded-lg flex items-center justify-center text-white font-bold transition-all"
                    style={{
                      background:
                        record.hoursWorked === 0
                          ? theme.colors.border
                          : record.hoursWorked < 4
                            ? '#3B82F6'
                            : record.hoursWorked < 8
                              ? '#8B5CF6'
                              : '#DC2626',
                      minWidth: `${Math.max(record.hoursWorked * 10, 30)}px`,
                    }}
                  >
                    {record.hoursWorked > 0 ? `${record.hoursWorked}h` : '-'}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="mt-6 p-4 rounded-lg text-center"
              style={{ background: theme.colors.surface }}
            >
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                Total This Week
              </p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                {thisWeek.totalHours}h
              </p>
            </div>
          </div>

          {/* Last Week */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              background: theme.colors.background,
              borderColor: theme.colors.border,
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: theme.colors.text }}>
              📆 Last Week
            </h2>
            <div className="space-y-3">
              {lastWeek.records.map((record) => (
                <div key={record.date} className="flex items-center gap-4">
                  <div className="min-w-24 text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>
                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div
                    className="flex-1 h-8 rounded-lg flex items-center justify-center text-white font-bold transition-all opacity-60"
                    style={{
                      background:
                        record.hoursWorked === 0
                          ? theme.colors.border
                          : record.hoursWorked < 4
                            ? '#3B82F6'
                            : record.hoursWorked < 8
                              ? '#8B5CF6'
                              : '#DC2626',
                      minWidth: `${Math.max(record.hoursWorked * 10, 30)}px`,
                    }}
                  >
                    {record.hoursWorked > 0 ? `${record.hoursWorked}h` : '-'}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="mt-6 p-4 rounded-lg text-center"
              style={{ background: theme.colors.surface }}
            >
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                Total Last Week
              </p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                {lastWeek.totalHours}h
              </p>
            </div>
          </div>
        </div>

        {/* Insights & Tips */}
        <div
          className="p-6 rounded-lg border-2"
          style={{
            background: theme.colors.background,
            borderColor: theme.colors.border,
          }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Award size={24} />
            Performance Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {metrics.productivityScore >= 90 && (
              <p style={{ color: theme.colors.success }}>
                ✅ Excellent consistency! You're maintaining a strong work schedule.
              </p>
            )}
            {metrics.longestStreak > 7 && (
              <p style={{ color: theme.colors.success }}>
                🔥 {metrics.longestStreak}-day streak! Keep up this momentum!
              </p>
            )}
            {weekComparison > 0 && (
              <p style={{ color: theme.colors.success }}>
                📈 You worked {Math.abs(weekComparison)}h more this week than last week. Great improvement!
              </p>
            )}
            {weekComparison < 0 && (
              <p style={{ color: theme.colors.warning }}>
                📉 You worked {Math.abs(weekComparison)}h less this week. Consider increasing your focus time.
              </p>
            )}
            {metrics.averageHoursPerDay >= 8 && (
              <p style={{ color: theme.colors.warning }}>
                ⚠️ You're averaging {metrics.averageHoursPerDay}h per day. Remember to take breaks!
              </p>
            )}
            {metrics.totalDaysTracked === 0 && (
              <p style={{ color: theme.colors.info }}>
                💡 Start logging your work hours to see personalized insights!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
