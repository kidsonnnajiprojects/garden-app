import { supabase } from '@/lib/supabase'
import { getCurrentWeather } from '@/lib/weather'
import Link from 'next/link'
import { Droplets, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import CareAllButtons from '@/components/CareAllButtons'

export const dynamic = 'force-dynamic'

async function getData() {
  const [plantsRes, logsRes, weather] = await Promise.all([
    supabase.from('plants').select('*').eq('active', true).order('name'),
    supabase.from('care_logs').select('*').order('log_date', { ascending: false }).limit(50),
    getCurrentWeather().catch(() => null),
  ])
  return { plants: plantsRes.data ?? [], logs: logsRes.data ?? [], weather }
}

function getDaysSinceWater(plantId: string, logs: { plant_id: string; care_type: string; log_date: string }[]) {
  const last = logs.find(l => l.plant_id === plantId && l.care_type === 'watering')
  if (!last) return null
  return Math.floor((Date.now() - new Date(last.log_date).getTime()) / 86400000)
}

export default async function Home() {
  const { plants, logs, weather } = await getData()

  const needsWater = plants.filter(p => {
    const days = getDaysSinceWater(p.id, logs)
    return days === null || days >= 2
  })

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold text-green-800">My Garden</h1>
          <p className="text-sm text-stone-500">Carrollton, TX</p>
        </div>
        {weather && (
          <div className="text-right">
            <p className="text-2xl font-bold">{Math.round(weather.temp_f)}°F</p>
            <p className="text-xs text-stone-500">{weather.description}</p>
          </div>
        )}
      </div>

      {needsWater.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="text-blue-600" size={18} />
            <span className="font-semibold text-blue-800">Needs Water</span>
          </div>
          <div className="space-y-1">
            {needsWater.slice(0, 3).map(p => {
              const days = getDaysSinceWater(p.id, logs)
              return (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm">{p.name}{p.variety ? ` (${p.variety})` : ''}</span>
                  <span className="text-xs text-blue-600">{days === null ? 'Never watered' : `${days}d ago`}</span>
                </div>
              )
            })}
            {needsWater.length > 3 && <p className="text-xs text-blue-500">+{needsWater.length - 3} more</p>}
          </div>
        </div>
      )}

      {plants.length > 0 && <CareAllButtons plantIds={plants.map(p => p.id)} />}

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-stone-700">Active Plants ({plants.length})</h2>
        <Link href="/plants/new" className="flex items-center gap-1 text-sm text-green-700 font-medium">
          <Plus size={16} /> Add
        </Link>
      </div>

      <div className="space-y-3">
        {plants.length === 0 && (
          <div className="text-center py-12 text-stone-400">
            <p className="text-lg mb-2">No plants yet</p>
            <Link href="/plants/new" className="text-green-700 font-medium">Add your first plant →</Link>
          </div>
        )}
        {plants.map(plant => {
          const daysSince = getDaysSinceWater(plant.id, logs)
          const alert = daysSince === null || daysSince >= 2
          return (
            <Link key={plant.id} href={`/plants/${plant.id}`}>
              <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm active:bg-stone-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{plant.name}</p>
                    {plant.variety && <p className="text-sm text-stone-500">{plant.variety}</p>}
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full">{plant.category}</span>
                      <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full">{plant.type}</span>
                      {plant.location && <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full">{plant.location}</span>}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${alert ? 'text-blue-600' : 'text-green-600'}`}>
                    <Droplets size={14} />
                    <span className="text-xs">{daysSince === null ? 'No log' : `${daysSince}d`}</span>
                  </div>
                </div>
                {plant.planted_date && (
                  <p className="text-xs text-stone-400 mt-2">
                    Planted {formatDistanceToNow(new Date(plant.planted_date))} ago
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
