# Weather-Based Theme System - Quick Start Guide

## 🎨 What You Get

Your app now automatically adapts its colors, fonts, and animations based on the user's location and weather:

- **☀️ Sunny**: Bright orange and gold theme
- **🌧️ Rainy**: Cool blue and cyan theme  
- **❄️ Snowy**: Crisp light blue theme
- **🔥 Hot**: Bold red and orange theme
- **🌙 Cozy**: Warm brown and amber theme

## ⚡ 3-Minute Setup (Already Done!)

### 1. Your app is wrapped with the provider ✅
The `App.tsx` already includes `WeatherThemeProvider`

### 2. CSS is imported ✅
`weatherTheme.css` is loaded in your app

### 3. Ready to use! ✅

## 🚀 Use It In Your Components

### Option 1: Use the Hook (Recommended)
```tsx
import { useWeatherThemeHook } from '../hooks/useWeatherTheme'

export function MyComponent() {
  const { weather, getGradientClass, getAccentClass } = useWeatherThemeHook()

  return (
    <div className={`bg-gradient-to-br ${getGradientClass()} p-6 rounded-lg`}>
      <h1>Currently: {weather?.location}</h1>
      <button className={getAccentClass()}>Click me</button>
    </div>
  )
}
```

### Option 2: Add Weather Display Widget
```tsx
import { WeatherThemeDisplay } from '../components/WeatherThemeDisplay'

// Add to your sidebar or layout
<WeatherThemeDisplay />
```

### Option 3: Use Hero Banner
```tsx
import { WeatherHeroBanner } from '../components/WeatherHeroBanner'

<WeatherHeroBanner 
  title="Welcome"
  subtitle="Manage your business"
  showWeatherInfo={true}
  height="md"
/>
```

## 📊 Available Hook Methods

```typescript
const {
  weather,              // { condition, temperature, location, humidity, windSpeed, ... }
  theme,               // Full theme config with colors
  loading,             // Boolean
  error,               // String or null
  refreshWeather,      // () => void
  setManualWeather,    // (condition) => void
  
  // Tailwind classes:
  getGradientClass(),  // 'from-amber-50 via-yellow-50 to-orange-100'
  getCardClass(),      // For card backgrounds
  getTextClass(),      // For text colors
  getAccentClass(),    // For buttons
  getThemeClasses(),   // All classes at once
} = useWeatherThemeHook()
```

## 🎯 Common Use Cases

### Example: Dashboard with Weather
```tsx
export function Dashboard() {
  const { weather, getGradientClass, getAccentClass } = useWeatherThemeHook()

  return (
    <div className={`bg-gradient-to-br ${getGradientClass()} min-h-screen p-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white bg-opacity-90 rounded-lg p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">{weather?.icon} Welcome</h1>
              <p className="text-gray-600 mt-2">{weather?.location}</p>
              <p className="text-sm text-gray-500">{weather?.description} • {weather?.temperature}°C</p>
            </div>
            <div className="text-right">
              <button className={`px-6 py-2 text-white rounded-lg font-semibold ${getAccentClass()}`}>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white bg-opacity-90 rounded-lg p-6 border hover:border-current">
              <h3 className="font-bold text-lg mb-2">Card {i}</h3>
              <p className="text-gray-600">Content here</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Example: Theme Selector
```tsx
export function Settings() {
  const { weather, setManualWeather } = useWeatherThemeHook()

  return (
    <div className="p-6 bg-white rounded-lg border space-y-4">
      <h3 className="font-bold text-xl">Theme Settings</h3>
      <div className="flex gap-2">
        {['sunny', 'rainy', 'snowy', 'hot', 'cozy'].map(condition => (
          <button
            key={condition}
            onClick={() => setManualWeather(condition)}
            className={`px-4 py-2 rounded-lg transition ${
              weather?.condition === condition
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100'
            }`}
          >
            {condition}
          </button>
        ))}
      </div>
    </div>
  )
}
```

## 🎨 Using CSS Variables Directly

If you prefer CSS, use these variables:

```css
.my-card {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 2px solid var(--color-border);
  transition: all var(--animation-duration) ease-in-out;
}

.my-card:hover {
  border-color: var(--color-primary);
  background-color: var(--color-background);
}

.my-button {
  background: var(--color-primary);
  color: white;
}

.my-button:hover {
  background: var(--color-secondary);
}
```

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `src/types/weather.ts` | Type definitions |
| `src/services/weatherService.ts` | Location & weather APIs |
| `src/contexts/WeatherThemeContext.tsx` | State management |
| `src/hooks/useWeatherTheme.ts` | Custom hook |
| `src/components/WeatherThemeDisplay.tsx` | Widget component |
| `src/components/WeatherHeroBanner.tsx` | Banner component |
| `src/styles/weatherTheme.css` | CSS variables |
| `src/styles/weatherThemes.ts` | Theme configs |

## 🔧 How It Works

1. **Location Detection**: 
   - Asks for GPS permission (user can deny)
   - Falls back to IP-based location
   - No API key needed!

2. **Weather Fetching**:
   - Uses free Open-Meteo API
   - Real-time weather data
   - Temperature, humidity, wind speed

3. **Theme Application**:
   - Maps weather condition to theme
   - Updates CSS variables
   - Smooth transitions between themes
   - Cached for 30 minutes

4. **Local Storage**:
   - Saves theme preferences
   - Works offline
   - Persists across sessions

## 🚫 What Does NOT Require Setup

✅ No Firebase configuration needed
✅ No API keys to add
✅ No npm packages to install
✅ No environment variables needed

## ❓ Troubleshooting

**Colors not changing?**
- Check browser console for errors
- Ensure `WeatherThemeProvider` wraps your app
- Try manual theme selection

**Location not found?**
- Check geolocation permission in browser settings
- Reset with `refreshWeather()` button
- Use manual theme selector as fallback

**Need different colors?**
- Edit `src/styles/weatherThemes.ts`
- Change color hex values
- Reload the page

## 🎓 Learn More

See `WEATHER_THEME_IMPLEMENTATION_GUIDE.md` for:
- Advanced usage patterns
- Customization options
- API reference
- Performance tips
- Browser compatibility

See `src/WEATHER_THEME_EXAMPLES.tsx` for code examples of:
- Dashboard with weather
- Theme selectors
- Conditional rendering
- Custom styling
- And more!

## 🎉 You're All Set!

Start integrating the weather theme into your pages. Try:

1. Add `WeatherThemeDisplay` to your sidebar
2. Update your Dashboard with theme colors
3. Use `getGradientClass()` on hero sections
4. Test manual theme selection
5. Share with users! 🚀

Happy theming! 🌈
