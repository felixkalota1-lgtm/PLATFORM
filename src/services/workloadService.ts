/**
 * Workload Detection Service
 * Monitors user activity and API calls to determine workload intensity
 */

interface WorkloadMetrics {
  apiCalls: number
  activeFeatures: number
  databaseOps: number
  userClicks: number
  timestamp: number
}

class WorkloadService {
  private metrics: WorkloadMetrics = {
    apiCalls: 0,
    activeFeatures: 0,
    databaseOps: 0,
    userClicks: 0,
    timestamp: Date.now(),
  }

  private workloadHistory: { timestamp: number; intensity: number }[] = []
  private maxIntensity = 100
  private decayRate = 0.95 // Activity decays over time
  private timezoneOffset = this.getUserTimezoneOffset()

  constructor() {
    this.initializeTracking()
    this.initializeDailyLogging()
  }

  /**
   * Get user's timezone offset
   */
  private getUserTimezoneOffset(): number {
    return new Date().getTimezoneOffset() / -60
  }

  /**
   * Initialize activity tracking
   */
  private initializeTracking() {
    // Track clicks
    document.addEventListener('click', () => {
      this.metrics.userClicks = Math.min(this.metrics.userClicks + 1, 20)
    })

    // Track keyboard activity
    document.addEventListener('keydown', () => {
      this.metrics.userClicks = Math.min(this.metrics.userClicks + 0.5, 20)
    })

    // Decay metrics over time
    setInterval(() => {
      this.metrics.apiCalls *= this.decayRate
      this.metrics.activeFeatures *= this.decayRate
      this.metrics.databaseOps *= this.decayRate
      this.metrics.userClicks *= this.decayRate
      this.metrics.timestamp = Date.now()
    }, 10000) // Every 10 seconds
  }

  /**
   * Initialize daily usage logging
   */
  private initializeDailyLogging() {
    const today = this.getTodayDateString()
    const storageKey = `pspm_daily_usage_${today}`
    const currentUsage = localStorage.getItem(storageKey)

    if (!currentUsage) {
      localStorage.setItem(storageKey, JSON.stringify({
        date: today,
        timezone: this.timezoneOffset,
        loginTime: new Date().toISOString(),
        sessions: [{ start: Date.now(), end: null }],
        totalMinutes: 0,
      }))
    }

    // Update usage every minute
    setInterval(() => {
      this.updateDailyUsage()
    }, 60000)
  }

  /**
   * Get today's date string
   */
  private getTodayDateString(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  /**
   * Update daily usage tracking
   */
  private updateDailyUsage() {
    const today = this.getTodayDateString()
    const storageKey = `pspm_daily_usage_${today}`
    const usage = JSON.parse(localStorage.getItem(storageKey) || '{}')

    if (usage.sessions && usage.sessions.length > 0) {
      const lastSession = usage.sessions[usage.sessions.length - 1]
      if (lastSession.end === null) {
        lastSession.end = Date.now()
        const sessionDuration = (lastSession.end - lastSession.start) / 60000 // minutes
        usage.totalMinutes = (usage.totalMinutes || 0) + sessionDuration
        localStorage.setItem(storageKey, JSON.stringify(usage))
      }
    }
  }

  /**
   * Log API call
   */
  logApiCall() {
    this.metrics.apiCalls = Math.min(this.metrics.apiCalls + 2, this.maxIntensity)
    this.recordWorkload()
  }

  /**
   * Log database operation
   */
  logDatabaseOp() {
    this.metrics.databaseOps = Math.min(this.metrics.databaseOps + 1.5, this.maxIntensity)
    this.recordWorkload()
  }

  /**
   * Log active feature (e.g., dashboard rendering, modal open)
   */
  logActiveFeature() {
    this.metrics.activeFeatures = Math.min(this.metrics.activeFeatures + 1, this.maxIntensity)
    this.recordWorkload()
  }

  /**
   * Record workload snapshot
   */
  private recordWorkload() {
    const intensity = this.calculateIntensity()
    this.workloadHistory.push({
      timestamp: Date.now(),
      intensity,
    })

    // Keep only last hour of history
    const oneHourAgo = Date.now() - 3600000
    this.workloadHistory = this.workloadHistory.filter(h => h.timestamp > oneHourAgo)
  }

  /**
   * Calculate current workload intensity (0-100)
   */
  calculateIntensity(workStartHour: number = 8, workEndHour: number = 18): number {
    const weights = {
      apiCalls: 0.4,
      databaseOps: 0.3,
      activeFeatures: 0.2,
      userClicks: 0.1,
    }

    const weighted =
      this.metrics.apiCalls * weights.apiCalls +
      this.metrics.databaseOps * weights.databaseOps +
      this.metrics.activeFeatures * weights.activeFeatures +
      this.metrics.userClicks * weights.userClicks

    // Time-of-day scaling: lighter blue at start, intensify red as approaching end
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const totalMinutes = hours * 60 + minutes
    const workStartMinutes = workStartHour * 60
    const workEndMinutes = workEndHour * 60
    
    let timeIntensityMultiplier = 1

    if (totalMinutes >= workStartMinutes && totalMinutes <= workEndMinutes) {
      // During work hours: scale from 0.5 (start) to 1.3 (end)
      const workProgressPercent = (totalMinutes - workStartMinutes) / (workEndMinutes - workStartMinutes)
      // At start: 0.5x (lighter), At end: 1.3x (more intense red)
      timeIntensityMultiplier = 0.5 + workProgressPercent * 0.8
    } else if (totalMinutes < workStartMinutes) {
      // Before work hours
      timeIntensityMultiplier = 0.3
    } else {
      // After work hours
      timeIntensityMultiplier = 0.4
    }

    const timeScaledIntensity = weighted * timeIntensityMultiplier

    return Math.min(Math.round(timeScaledIntensity), 100)
  }

  /**
   * Get average workload intensity over time period (in seconds)
   */
  getAverageIntensity(seconds: number = 300): number {
    const cutoff = Date.now() - seconds * 1000
    const recentHistory = this.workloadHistory.filter(h => h.timestamp > cutoff)

    if (recentHistory.length === 0) return 0

    const sum = recentHistory.reduce((acc, h) => acc + h.intensity, 0)
    return Math.round(sum / recentHistory.length)
  }

  /**
   * Get daily usage info
   */
  getDailyUsageInfo() {
    const today = this.getTodayDateString()
    const storageKey = `pspm_daily_usage_${today}`
    const usage = JSON.parse(localStorage.getItem(storageKey) || '{}')

    return {
      date: usage.date,
      timezone: usage.timezone,
      totalMinutes: usage.totalMinutes || 0,
      isActiveHours: this.isWithinWorkHours(),
      hoursWorked: Math.round((usage.totalMinutes || 0) / 60 * 10) / 10,
    }
  }

  /**
   * Check if current time is within work hours (8-18)
   */
  private isWithinWorkHours(): boolean {
    const now = new Date()
    const hour = now.getHours()
    return hour >= 8 && hour < 18
  }

  /**
   * Get all metrics
   */
  getMetrics(): WorkloadMetrics {
    return { ...this.metrics }
  }
}

export const workloadService = new WorkloadService()
