const LAT = 32.9756
const LON = -96.8897

export type WeatherDay = {
  date: string
  precipitation_mm: number
  temp_max_f: number
  temp_min_f: number
  description: string
}

export type CurrentWeather = {
  temp_f: number
  humidity: number
  precipitation_mm: number
  wind_mph: number
  description: string
}

export async function getCurrentWeather(): Promise<CurrentWeather> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Chicago`
  )
  const data = await res.json()
  const c = data.current
  return {
    temp_f: c.temperature_2m,
    humidity: c.relative_humidity_2m,
    precipitation_mm: c.precipitation,
    wind_mph: c.wind_speed_10m,
    description: weatherCodeToDescription(c.weather_code),
  }
}

export async function getRecentWeather(days = 14): Promise<WeatherDay[]> {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)

  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&temperature_unit=fahrenheit&timezone=America/Chicago&start_date=${startStr}&end_date=${endStr}`
  )
  const data = await res.json()
  const daily = data.daily

  return daily.time.map((date: string, i: number) => ({
    date,
    precipitation_mm: daily.precipitation_sum[i] ?? 0,
    temp_max_f: daily.temperature_2m_max[i],
    temp_min_f: daily.temperature_2m_min[i],
    description: weatherCodeToDescription(daily.weather_code[i]),
  }))
}

function weatherCodeToDescription(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code <= 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code <= 49) return 'Foggy'
  if (code <= 59) return 'Drizzle'
  if (code <= 69) return 'Rain'
  if (code <= 79) return 'Snow'
  if (code <= 82) return 'Rain showers'
  if (code <= 99) return 'Thunderstorm'
  return 'Unknown'
}
