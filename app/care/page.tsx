import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Droplets, Zap, Scissors, Bug, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const careIcons = {
  watering: { icon: Droplets, color: 'text-blue-600 bg-blue-50', label: 'Watered' },
  fertilizing: { icon: Zap, color: 'text-yellow-600 bg-yellow-50', label: 'Fertilized' },
  pruning: { icon: Scissors, color: 'text-green-600 bg-green-50', label: 'Pruned' },
  pest_treatment: { icon: Bug, color: 'text-red-600 bg-red-50', label: 'Pest Tx' },
  other: { icon: MoreHorizontal, color: 'text-stone-600 bg-stone-100', label: 'Other' },
}

export default async function CarePage() {
  const [logsRes, plantsRes] = await Promise.all([
    supabase.from('care_logs').select('*, plants(name, variety)').order('log_date', { ascending: false }).order('created_at', { ascending: false }).limit(100),
    supabase.from('plants').select('id, name, variety').eq('active', true).order('name'),
  ])

  const logs = logsRes.data ?? []
  const plants = plantsRes.data ?? []

  type LogWithPlant = typeof logs[number]
  const grouped = logs.reduce((acc, log) => {
    const date = log.log_date
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {} as Record<string, LogWithPlant[]>)

  const now = Date.now()
  const lastWatered: Record<string, string> = {}
  const lastFertilized: Record<string, string> = {}
  for (const log of logs) {
    if (log.care_type === 'watering' && !lastWatered[log.plant_id]) lastWatered[log.plant_id] = log.log_date
    if (log.care_type === 'fertilizing' && !lastFertilized[log.plant_id]) lastFertilized[log.plant_id] = log.log_date
  }

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-2xl font-bold text-green-800 pt-4">Care Log</h1>

      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <h2 className="font-semibold text-stone-700 mb-3 text-sm">Last Care Per Plant</h2>
        <div className="space-y-2">
          {plants.map(plant => {
            const water = lastWatered[plant.id]
            const fert = lastFertilized[plant.id]
            const waterDays = water ? Math.floor((now - new Date(water).getTime()) / 86400000) : null
            return (
              <Link key={plant.id} href={`/plants/${plant.id}`}>
                <div className="flex items-center justify-between py-1.5 border-b border-stone-50 last:border-0">
                  <span className="text-sm font-medium">{plant.name}{plant.variety ? ` · ${plant.variety}` : ''}</span>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1">
                      <Droplets size={12} className={waterDays !== null && waterDays < 2 ? 'text-green-600' : 'text-blue-400'} />
                      <span className="text-xs text-stone-500">{water ? `${waterDays}d` : '—'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap size={12} className="text-yellow-500" />
                      <span className="text-xs text-stone-500">{fert ? `${Math.floor((now - new Date(fert).getTime()) / 86400000)}d` : '—'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <h2 className="font-semibold text-stone-700">History</h2>
      <div className="space-y-4">
        {(Object.entries(grouped) as [string, LogWithPlant[]][]).map(([date, dayLogs]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-stone-400 uppercase mb-2">{format(new Date(date), 'EEEE, MMM d')}</p>
            <div className="space-y-2">
              {dayLogs.map(log => {
                const care = careIcons[log.care_type as keyof typeof careIcons] ?? careIcons.other
                const Icon = care.icon
                return (
                  <div key={log.id} className="bg-white rounded-lg border border-stone-200 p-3 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${care.color}`}><Icon size={15} /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{(log as { plants?: { name: string; variety?: string } }).plants?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-stone-400">{care.label}{log.notes ? ` · ${log.notes}` : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="text-stone-400 text-sm text-center py-8">No care logged yet. Tap a plant to log care.</p>}
      </div>
    </div>
  )
}
