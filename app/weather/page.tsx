import { getCurrentWeather, getRecentWeather } from '@/lib/weather'
import { CloudRain, Thermometer, Wind, Droplets } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function WeatherPage() {
  const [current, recent] = await Promise.all([
    getCurrentWeather().catch(() => null),
    getRecentWeather(14).catch(() => []),
  ])

  const rainDays = recent.filter(d => d.precipitation_mm > 1)
  const dryDays = recent.filter(d => d.precipitation_mm < 1)
  const lastRain = rainDays[rainDays.length - 1]

  const totalRain = recent.reduce((sum, d) => sum + d.precipitation_mm, 0)
  const dryStreak = (() => {
    let streak = 0
    for (let i = recent.length - 1; i >= 0; i--) {
      if (recent[i].precipitation_mm < 1) streak++
      else break
    }
    return streak
  })()

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-2xl font-bold text-green-800 pt-4">Weather</h1>
      <p className="text-sm text-stone-500 -mt-3">Carrollton, TX 75010</p>

      {current && (
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 text-white">
          <p className="text-5xl font-bold">{Math.round(current.temp_f)}°F</p>
          <p className="text-sky-100 mt-1">{current.description}</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="flex items-center gap-1.5">
              <Droplets size={14} className="text-sky-200" />
              <span className="text-sm">{current.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind size={14} className="text-sky-200" />
              <span className="text-sm">{Math.round(current.wind_mph)} mph</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CloudRain size={14} className="text-sky-200" />
              <span className="text-sm">{current.precipitation_mm.toFixed(1)} mm</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{dryStreak}</p>
          <p className="text-xs text-stone-500 mt-1">Dry days in a row</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
          <p className="text-2xl font-bold text-sky-600">{rainDays.length}</p>
          <p className="text-xs text-stone-500 mt-1">Rain days (14d)</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
          <p className="text-2xl font-bold text-teal-600">{totalRain.toFixed(0)}</p>
          <p className="text-xs text-stone-500 mt-1">mm rain (14d)</p>
        </div>
      </div>

      {dryStreak >= 3 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-semibold text-amber-800">🌵 Dry Spell Alert</p>
          <p className="text-sm text-amber-700 mt-1">
            {dryStreak} days without significant rain. Container plants likely need daily watering in this Texas heat.
          </p>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-stone-700 mb-3">Last 14 Days</h2>
        <div className="space-y-1.5">
          {[...recent].reverse().map(day => (
            <div key={day.date} className="bg-white rounded-lg border border-stone-200 px-3 py-2 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{format(new Date(day.date), 'EEE, MMM d')}</span>
                <span className="text-xs text-stone-400 ml-2">{day.description}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-stone-500">{Math.round(day.temp_min_f)}–{Math.round(day.temp_max_f)}°</span>
                {day.precipitation_mm > 0.5 && (
                  <span className="flex items-center gap-0.5 text-blue-600">
                    <CloudRain size={12} /> {day.precipitation_mm.toFixed(1)}mm
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
