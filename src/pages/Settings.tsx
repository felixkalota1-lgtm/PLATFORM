import { useState, useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { useWorkloadTheme } from '../contexts/WorkloadThemeContext'
import { Save, RotateCcw, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const { theme, refreshMetrics } = useWorkloadTheme()
  const [startHour, setStartHour] = useState(settings.workStartHour)
  const [endHour, setEndHour] = useState(settings.workEndHour)
  const [saved, setSaved] = useState(false)

  // Sync state when settings change
  useEffect(() => {
    setStartHour(settings.workStartHour)
    setEndHour(settings.workEndHour)
  }, [settings])

  const handleSave = async () => {
    console.log('Save clicked - Start:', startHour, 'End:', endHour)
    
    if (startHour >= endHour) {
      toast.error('Start time must be before end time')
      return
    }

    try {
      // Update settings
      updateSettings({
        workStartHour: startHour,
        workEndHour: endHour,
      })

      // Refresh the theme with new settings
      refreshMetrics()

      // Show success feedback
      setSaved(true)
      toast.success('✅ Work hours saved successfully!')
      
      // Clear saved indicator after 3 seconds
      setTimeout(() => setSaved(false), 3000)

      console.log('Settings saved:', { startHour, endHour })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const handleReset = async () => {
    console.log('Reset clicked')
    
    try {
      resetSettings()
      setStartHour(8)
      setEndHour(18)
      
      // Refresh the theme
      refreshMetrics()

      toast.success('✅ Settings reset to default')
      setSaved(false)
      
      console.log('Settings reset to default')
    } catch (error) {
      console.error('Failed to reset settings:', error)
      toast.error('Failed to reset settings')
    }
  }

  // Preset options
  const applyFullDayPreset = async () => {
    console.log('Full Day preset applied')
    setStartHour(8)
    setEndHour(18)
    
    // Auto-save the preset
    try {
      updateSettings({
        workStartHour: 8,
        workEndHour: 18,
      })
      refreshMetrics()
      setSaved(true)
      toast.success('✅ Full day preset applied (8 AM - 6 PM)')
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to apply Full Day preset:', error)
      toast.error('Failed to apply preset')
    }
  }

  const applyHalfDayPreset = async () => {
    console.log('Half Day preset applied')
    setStartHour(8)
    setEndHour(13)
    
    // Auto-save the preset
    try {
      updateSettings({
        workStartHour: 8,
        workEndHour: 13,
      })
      refreshMetrics()
      setSaved(true)
      toast.success('✅ Half-day preset applied (8 AM - 1 PM)')
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to apply Half Day preset:', error)
      toast.error('Failed to apply preset')
    }
  }

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour.toString().padStart(2, '0')}:00 ${period}`
  }

  return (
    <div className="min-h-screen p-6" style={{ background: theme.gradients.bg, color: theme.colors.text }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
            {theme.icon} Work Settings
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Customize your work hours for accurate workload tracking
          </p>
        </div>

        {/* Settings Card */}
        <div
          className="rounded-lg border-2 shadow-lg p-8"
          style={{
            background: theme.colors.background,
            borderColor: theme.colors.border,
          }}
        >
          {/* Preset Options */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3" style={{ color: theme.colors.text }}>
              Quick Presets
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={applyFullDayPreset}
                className="p-3 rounded-lg font-semibold transition-all hover:opacity-90 text-white"
                style={{ background: theme.colors.primary }}
              >
                <Clock size={16} className="mx-auto mb-1" />
                Full Day
              </button>
              <button
                onClick={applyHalfDayPreset}
                className="p-3 rounded-lg font-semibold transition-all hover:opacity-90 text-white"
                style={{ background: theme.colors.warning }}
              >
                <Clock size={16} className="mx-auto mb-1" />
                Half Day
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: theme.colors.textSecondary }}>
              Click a preset to quickly set your work hours
            </p>
          </div>

          <hr style={{ borderColor: theme.colors.border, margin: '2rem 0' }} />

          {/* Work Start Time */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3" style={{ color: theme.colors.text }}>
              Work Start Time
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="23"
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: theme.colors.border,
                }}
              />
              <div
                className="min-w-32 px-4 py-2 rounded-lg text-center font-bold text-lg"
                style={{
                  background: theme.colors.primary,
                  color: '#fff',
                }}
              >
                {formatTime(startHour)}
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: theme.colors.textSecondary }}>
              When your workday begins (0-23 hours)
            </p>
          </div>

          {/* Work End Time */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3" style={{ color: theme.colors.text }}>
              Work End Time
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="23"
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: theme.colors.border,
                }}
              />
              <div
                className="min-w-32 px-4 py-2 rounded-lg text-center font-bold text-lg"
                style={{
                  background: theme.colors.primary,
                  color: '#fff',
                }}
              >
                {formatTime(endHour)}
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: theme.colors.textSecondary }}>
              When your workday ends (0-23 hours)
            </p>
          </div>

          {/* Work Duration */}
          <div className="mb-8 p-4 rounded-lg" style={{ background: theme.colors.surface }}>
            <p className="text-sm font-semibold" style={{ color: theme.colors.text }}>
              Total Work Hours: <span style={{ color: theme.colors.primary }}>{endHour - startHour}h</span>
            </p>
          </div>

          {/* Preview */}
          <div className="mb-8 p-4 rounded-lg border" style={{ borderColor: theme.colors.border }}>
            <p className="text-sm font-semibold mb-2" style={{ color: theme.colors.text }}>
              Work Schedule Preview
            </p>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              You will work from {formatTime(startHour)} to {formatTime(endHour)} daily
            </p>
            <p className="text-xs mt-2" style={{ color: theme.colors.warning }}>
              🎨 Theme intensity will scale based on your work hours
            </p>
          </div>

          {/* Success Message */}
          {saved && (
            <div 
              className="mb-8 p-4 rounded-lg border-2 flex items-center gap-3"
              style={{
                background: theme.colors.background,
                borderColor: theme.colors.success,
              }}
            >
              <CheckCircle size={24} style={{ color: theme.colors.success }} />
              <div>
                <p className="font-semibold" style={{ color: theme.colors.success }}>
                  Settings Saved!
                </p>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Your work hours have been updated and the theme will adjust accordingly
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90 hover:shadow-lg cursor-pointer"
              style={{
                background: theme.colors.success,
                color: '#fff',
              }}
            >
              <Save size={20} />
              Save Settings
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90 hover:shadow-lg cursor-pointer"
              style={{
                background: theme.colors.border,
                color: theme.colors.text,
              }}
            >
              <RotateCcw size={20} />
              Reset to Default
            </button>
          </div>

          {/* Current Settings Info */}
          <div className="mt-8 p-4 rounded-lg" style={{ background: theme.colors.surface }}>
            <p className="text-xs font-semibold mb-2" style={{ color: theme.colors.text }}>
              ℹ️ How It Works
            </p>
            <ul className="text-xs space-y-1" style={{ color: theme.colors.textSecondary }}>
              <li>• At your start time, the theme shows calm blue (low intensity)</li>
              <li>• As time progresses, colors warm up (green → yellow → orange → red)</li>
              <li>• At your end time, red reaches maximum intensity</li>
              <li>• After work hours, the theme returns to low intensity</li>
              <li>• Your settings are saved locally and persist across sessions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
