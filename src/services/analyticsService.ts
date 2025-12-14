/**
 * Analytics Service
 * Analyzes work hours and activity data from localStorage
 */

export interface DailyRecord {
  date: string
  hoursWorked: number
  isWorkHours: boolean
}

export interface WeeklyStats {
  week: string
  totalHours: number
  averageDaily: number
  busyDays: number
  records: DailyRecord[]
}

export interface ActivityMetrics {
  totalDaysTracked: number
  totalHoursWorked: number
  averageHoursPerDay: number
  longestStreak: number
  thisWeekHours: number
  lastWeekHours: number
  productivityScore: number
}

class AnalyticsService {
  /**
   * Get all daily usage records
   */
  getAllDailyRecords(): DailyRecord[] {
    const records: DailyRecord[] = []
    
    // Get all items from localStorage that look like daily logs
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.match(/^\d{4}-\d{2}-\d{2}$/)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          records.push({
            date: key,
            hoursWorked: data.totalMinutes ? Math.round(data.totalMinutes / 60 * 10) / 10 : 0,
            isWorkHours: data.isActiveHours || false,
          })
        } catch (e) {
          console.warn(`Failed to parse daily record for ${key}:`, e)
        }
      }
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  /**
   * Get this week's data
   */
  getThisWeekData(): WeeklyStats {
    const today = new Date()
    const sundayOfThisWeek = new Date(today)
    sundayOfThisWeek.setDate(today.getDate() - today.getDay())

    return this.getWeekData(sundayOfThisWeek)
  }

  /**
   * Get last week's data
   */
  getLastWeekData(): WeeklyStats {
    const today = new Date()
    const lastSunday = new Date(today)
    lastSunday.setDate(today.getDate() - today.getDay() - 7)

    return this.getWeekData(lastSunday)
  }

  /**
   * Get week data starting from a date
   */
  private getWeekData(startDate: Date): WeeklyStats {
    const records: DailyRecord[] = []
    const weekStart = new Date(startDate)
    weekStart.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr = this.formatDate(date)

      try {
        const data = JSON.parse(localStorage.getItem(dateStr) || '{}')
        records.push({
          date: dateStr,
          hoursWorked: data.totalMinutes ? Math.round(data.totalMinutes / 60 * 10) / 10 : 0,
          isWorkHours: data.isActiveHours || false,
        })
      } catch (e) {
        records.push({
          date: dateStr,
          hoursWorked: 0,
          isWorkHours: false,
        })
      }
    }

    const totalHours = records.reduce((sum, r) => sum + r.hoursWorked, 0)
    const busyDays = records.filter(r => r.hoursWorked > 0).length

    return {
      week: `${weekStart.toLocaleDateString()} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
      totalHours: Math.round(totalHours * 10) / 10,
      averageDaily: busyDays > 0 ? Math.round(totalHours / busyDays * 10) / 10 : 0,
      busyDays,
      records,
    }
  }

  /**
   * Calculate comprehensive activity metrics
   */
  getActivityMetrics(): ActivityMetrics {
    const allRecords = this.getAllDailyRecords()
    const thisWeek = this.getThisWeekData()
    const lastWeek = this.getLastWeekData()

    const totalHoursWorked = allRecords.reduce((sum, r) => sum + r.hoursWorked, 0)
    const totalDaysTracked = allRecords.filter(r => r.hoursWorked > 0).length
    const averageHoursPerDay = totalDaysTracked > 0 ? totalHoursWorked / totalDaysTracked : 0

    // Calculate longest streak
    let longestStreak = 0
    let currentStreak = 0
    for (const record of allRecords.reverse()) {
      if (record.hoursWorked > 0) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    // Productivity score (0-100)
    // Based on: consistency, hours worked, weekly comparison
    const consistency = (totalDaysTracked / Math.max(allRecords.length, 1)) * 100
    const hoursScore = Math.min((averageHoursPerDay / 8) * 100, 100)
    const weekComparison = thisWeek.totalHours > lastWeek.totalHours ? 110 : 90
    const productivityScore = Math.round((consistency * 0.4 + hoursScore * 0.4 + weekComparison * 0.2) / 2)

    return {
      totalDaysTracked,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      averageHoursPerDay: Math.round(averageHoursPerDay * 10) / 10,
      longestStreak,
      thisWeekHours: thisWeek.totalHours,
      lastWeekHours: lastWeek.totalHours,
      productivityScore: Math.min(productivityScore, 100),
    }
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * Get performance badge based on metrics
   */
  getPerformanceBadge(metrics: ActivityMetrics): { emoji: string; label: string; color: string } {
    if (metrics.productivityScore >= 90) {
      return { emoji: '🏆', label: 'Elite', color: '#FFD700' }
    }
    if (metrics.productivityScore >= 75) {
      return { emoji: '⭐', label: 'Strong', color: '#9333EA' }
    }
    if (metrics.productivityScore >= 60) {
      return { emoji: '👍', label: 'Good', color: '#3B82F6' }
    }
    if (metrics.productivityScore >= 45) {
      return { emoji: '📈', label: 'Fair', color: '#F59E0B' }
    }
    return { emoji: '🚀', label: 'Getting Started', color: '#10B981' }
  }
}

export const analyticsService = new AnalyticsService()
