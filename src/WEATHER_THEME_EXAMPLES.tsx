/**
 * Weather Theme Usage Examples
 * Shows how to use the weather-based theming system throughout the app
 */

// ============================================================================
// BASIC USAGE IN COMPONENTS
// ============================================================================

/**
 * Example 1: Using the hook in a dashboard component
 */
import { useWeatherThemeHook } from './hooks/useWeatherTheme'

export function DashboardExample() {
  const { weather, getGradientClass, getAccentClass } = useWeatherThemeHook()

  return (
    <div className={`flex-1 bg-gradient-to-br ${getGradientClass()} rounded-lg p-6`}>
      <h1 className="text-3xl font-bold mb-4">
        Welcome {weather?.location && `to ${weather.location}`}
      </h1>
      <p className="text-lg mb-6">
        {weather?.description} - {weather?.temperature}°C
      </p>
      <button className={`px-6 py-2 text-white rounded-lg ${getAccentClass()}`}>
        Take Action
      </button>
    </div>
  )
}

// ============================================================================
// USING THE WEATHER DISPLAY COMPONENT
// ============================================================================

/**
 * Example 2: Add weather info to your Layout or Sidebar
 */
import { WeatherThemeDisplay } from './components/WeatherThemeDisplay'

export function LayoutExample() {
  return (
    <div className="flex">
      <aside className="w-64 p-4 border-r">
        {/* Your navigation here */}
        
        {/* Add weather display at the bottom */}
        <div className="mt-8">
          <WeatherThemeDisplay />
        </div>
      </aside>
      <main className="flex-1">
        {/* Main content */}
      </main>
    </div>
  )
}

// ============================================================================
// USING THE HERO BANNER
// ============================================================================

/**
 * Example 3: Using weather-themed hero banner
 */
import { WeatherHeroBanner } from './components/WeatherHeroBanner'

export function PageHeaderExample() {
  return (
    <div className="space-y-6">
      <WeatherHeroBanner
        title="Dashboard"
        subtitle="Manage your operations efficiently"
        showWeatherInfo={true}
        height="md"
      />
      
      {/* Page content */}
    </div>
  )
}

// ============================================================================
// ACCESSING THEME DATA DIRECTLY
// ============================================================================

/**
 * Example 4: Getting all theme colors for custom styling
 */
export function CustomStyledComponent() {
  const { theme, weather } = useWeatherThemeHook()

  if (!theme) return null

  return (
    <div
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        borderColor: theme.colors.border,
        borderWidth: '2px',
      }}
      className="p-6 rounded-lg"
    >
      <h2 className="text-xl font-bold mb-2">
        {weather?.condition.toUpperCase()} Theme
      </h2>
      <p>This component uses direct CSS values from the theme.</p>
      <div className="mt-4 flex gap-2">
        <div
          style={{ backgroundColor: theme.colors.primary }}
          className="w-12 h-12 rounded"
        />
        <div
          style={{ backgroundColor: theme.colors.secondary }}
          className="w-12 h-12 rounded"
        />
        <div
          style={{ backgroundColor: theme.colors.accent }}
          className="w-12 h-12 rounded"
        />
      </div>
    </div>
  )
}

// ============================================================================
// USING CSS CUSTOM PROPERTIES
// ============================================================================

/**
 * Example 5: Using CSS custom properties in CSS files or styled components
 */

// In your CSS file:
/*
.weather-card {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  color: var(--color-text);
  border-radius: 0.5rem;
  padding: 1rem;
  transition: all var(--animation-duration) ease-in-out;
}

.weather-card:hover {
  border-color: var(--color-primary);
  background-color: var(--color-background);
}

.weather-button {
  background: var(--color-primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all var(--animation-duration) ease-in-out;
}

.weather-button:hover {
  background: var(--color-secondary);
  transform: translateY(-2px);
}
*/

// In JSX:
export function CSSVariableExample() {
  return (
    <div className="weather-card">
      <h3 className="text-lg font-bold mb-2">Weather-themed Card</h3>
      <p className="mb-4">This card uses CSS custom properties for styling.</p>
      <button className="weather-button">Learn More</button>
    </div>
  )
}

// ============================================================================
// THEME-AWARE CONDITIONAL RENDERING
// ============================================================================

/**
 * Example 6: Render different content based on weather condition
 */
export function WeatherConditionalExample() {
  const { weather } = useWeatherThemeHook()

  return (
    <div className="space-y-4">
      {weather?.condition === 'sunny' && (
        <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
          ☀️ It's sunny! Perfect time for outdoor activities.
        </div>
      )}

      {weather?.condition === 'rainy' && (
        <div className="p-4 bg-blue-100 border-l-4 border-blue-500 rounded">
          🌧️ It's rainy. Great day to stay productive indoors.
        </div>
      )}

      {weather?.condition === 'snowy' && (
        <div className="p-4 bg-cyan-100 border-l-4 border-cyan-500 rounded">
          ❄️ It's snowy! Beautiful weather outside.
        </div>
      )}

      {weather?.condition === 'hot' && (
        <div className="p-4 bg-red-100 border-l-4 border-red-500 rounded">
          🔥 It's hot! Stay hydrated and take breaks.
        </div>
      )}

      {weather?.condition === 'cozy' && (
        <div className="p-4 bg-amber-100 border-l-4 border-amber-500 rounded">
          🌙 Perfect cozy weather. Time to relax.
        </div>
      )}
    </div>
  )
}

// ============================================================================
// USING GRADIENT CLASSES FOR BACKGROUNDS
// ============================================================================

/**
 * Example 7: Hero sections with weather gradients
 */
export function HeroSectionExample() {
  const { getGradientClass, weather } = useWeatherThemeHook()

  return (
    <div
      className={`
        h-96 rounded-lg flex items-center justify-center
        bg-gradient-to-br ${getGradientClass()}
        overflow-hidden relative
      `}
    >
      <div className="text-center relative z-10">
        <div className="text-6xl mb-4">{weather?.icon}</div>
        <h1 className="text-4xl font-bold mb-2">Welcome</h1>
        <p className="text-xl">{weather?.location}</p>
      </div>
    </div>
  )
}

// ============================================================================
// MANUAL WEATHER THEME SWITCHING
// ============================================================================

/**
 * Example 8: Settings component for manual theme control
 */
export function ThemeSettingsExample() {
  const { weather, setManualWeather, refreshWeather } = useWeatherThemeHook()

  const weatherOptions = [
    { condition: 'sunny', label: 'Sunny ☀️' },
    { condition: 'rainy', label: 'Rainy 🌧️' },
    { condition: 'snowy', label: 'Snowy ❄️' },
    { condition: 'hot', label: 'Hot 🔥' },
    { condition: 'cozy', label: 'Cozy 🌙' },
  ] as const

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg border">
      <h3 className="text-xl font-bold">Theme Settings</h3>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Manual Theme Selection</label>
        <div className="flex gap-2 flex-wrap">
          {weatherOptions.map(({ condition, label }) => (
            <button
              key={condition}
              onClick={() => setManualWeather(condition)}
              className={`
                px-4 py-2 rounded-lg transition-all
                ${
                  weather?.condition === condition
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                    : 'bg-gray-100 hover:bg-gray-200'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={refreshWeather}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Refresh Location & Weather
      </button>
    </div>
  )
}

// ============================================================================
// CREATING WEATHER-AWARE DATA VISUALIZATIONS
// ============================================================================

/**
 * Example 9: Chart colors that match the current theme
 */
export function ChartExample() {
  const { theme } = useWeatherThemeHook()

  if (!theme) return null

  // Example chart data for demonstration
  // Uncomment and use with your chart library (e.g., Chart.js, Recharts)
  /*
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.accent,
        data: [12, 19, 3, 5, 2, 3],
      },
      {
        label: 'Profit',
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.primary,
        data: [8, 14, 6, 9, 4, 7],
      },
    ],
  }
  */

  // Pass to your chart library (e.g., Chart.js, Recharts)
  return (
    <div className="p-6 bg-white rounded-lg border">
      <h3 className="text-lg font-bold mb-4">Sales Overview</h3>
      {/* <Chart data={chartData} /> */}
      <p className="text-gray-600">Chart component would go here with theme-aware colors</p>
    </div>
  )
}

// ============================================================================
// WEATHER-AWARE NOTIFICATIONS
// ============================================================================

/**
 * Example 10: Toast notifications that match theme
 */
import toast from 'react-hot-toast'

export function NotificationExample() {
  const { theme } = useWeatherThemeHook()

  const showNotification = () => {
    toast.success('Operation successful!', {
      style: {
        background: theme?.colors.success || '#32CD32',
        color: 'white',
        border: `2px solid ${theme?.colors.accent || '#FF8C00'}`,
      },
    })
  }

  return (
    <button
      onClick={showNotification}
      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
    >
      Show Notification
    </button>
  )
}

// ============================================================================
// INTEGRATION WITH FORMS
// ============================================================================

/**
 * Example 11: Form inputs with weather theme
 */
export function FormExample() {
  const { getCardClass, getAccentClass } = useWeatherThemeHook()

  return (
    <form className={`p-6 rounded-lg border ${getCardClass()}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            className="input-weather w-full"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="input-weather w-full"
            placeholder="Enter your email"
          />
        </div>

        <button type="submit" className={`w-full py-2 text-white rounded-lg ${getAccentClass()}`}>
          Submit
        </button>
      </div>
    </form>
  )
}

export default {}
