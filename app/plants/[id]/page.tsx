import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Droplets, Zap, Scissors, Bug, MoreHorizontal } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import QuickCareButtons from '@/components/QuickCareButtons'
import DeletePlantButton from '@/components/DeletePlantButton'

export const dynamic = 'force-dynamic'

async function getPlant(id: string) {
  const [plantRes, logsRes] = await Promise.all([
    supabase.from('plants').select('*').eq('id', id).single(),
    supabase.from('care_logs').select('*').eq('plant_id', id).order('log_date', { ascending: false }).limit(30),
  ])
  return { plant: plantRes.data, logs: logsRes.data ?? [] }
}

const careIcons = {
  watering: Droplets,
  fertilizing: Zap,
  pruning: Scissors,
  pest_treatment: Bug,
  other: MoreHorizontal,
}

const careColors = {
  watering: 'text-blue-600 bg-blue-50',
  fertilizing: 'text-yellow-600 bg-yellow-50',
  pruning: 'text-green-600 bg-green-50',
  pest_treatment: 'text-red-600 bg-red-50',
  other: 'text-stone-600 bg-stone-100',
}

export default async function PlantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { plant, logs } = await getPlant(id)
  if (!plant) notFound()

  const today = new Date()
  const plantedDate = plant.planted_date ? new Date(plant.planted_date) : null
  const daysSincePlanted = plantedDate ? Math.floor((today.getTime() - plantedDate.getTime()) / 86400000) : null

  const expectedHarvestDate = plantedDate && plant.expected_days_to_maturity
    ? new Date(plantedDate.getTime() + plant.expected_days_to_maturity * 86400000)
    : null

  const expectedGermDate = plantedDate && plant.expected_germination_days
    ? new Date(plantedDate.getTime() + plant.expected_germination_days * 86400000)
    : null

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-3 pt-4">
        <Link href="/" className="text-stone-500"><ChevronLeft size={24} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-green-800">{plant.name}</h1>
          {plant.variety && <p className="text-sm text-stone-500">{plant.variety}</p>}
        </div>
        <Link href={`/plants/${plant.id}/edit`} className="text-sm text-green-700 font-medium px-3 py-1.5 border border-green-200 rounded-lg">
          Edit
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-stone-400 text-xs">Category</p>
            <p className="font-medium capitalize">{plant.category}</p>
          </div>
          <div>
            <p className="text-stone-400 text-xs">Started From</p>
            <p className="font-medium capitalize">{plant.type}</p>
          </div>
          {plant.location && (
            <div>
              <p className="text-stone-400 text-xs">Location</p>
              <p className="font-medium">{plant.location}</p>
            </div>
          )}
          {plantedDate && (
            <div>
              <p className="text-stone-400 text-xs">Planted</p>
              <p className="font-medium">{format(plantedDate, 'MMM d, yyyy')}</p>
            </div>
          )}
        </div>

        {(expectedGermDate || expectedHarvestDate) && (
          <div className="border-t border-stone-100 pt-3 space-y-2">
            {expectedGermDate && !plant.germination_date && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Expected germination</span>
                <span className={expectedGermDate < today ? 'text-amber-600 font-medium' : 'font-medium'}>
                  {expectedGermDate < today ? 'Overdue — ' : ''}{format(expectedGermDate, 'MMM d')}
                </span>
              </div>
            )}
            {plant.germination_date && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Germinated</span>
                <span className="font-medium text-green-700">{format(new Date(plant.germination_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            {expectedHarvestDate && !plant.first_harvest_date && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Expected harvest</span>
                <span className="font-medium">{format(expectedHarvestDate, 'MMM d, yyyy')}</span>
              </div>
            )}
            {plant.first_harvest_date && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">First harvest</span>
                <span className="font-medium text-green-700">{format(new Date(plant.first_harvest_date), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <QuickCareButtons plantId={plant.id} />
      <DeletePlantButton plantId={plant.id} />

      <div>
        <h2 className="font-semibold text-stone-700 mb-3">Care History</h2>
        {logs.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-6">No care logged yet</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => {
              const Icon = careIcons[log.care_type as keyof typeof careIcons] ?? MoreHorizontal
              const color = careColors[log.care_type as keyof typeof careColors] ?? careColors.other
              return (
                <div key={log.id} className="bg-white rounded-lg border border-stone-200 p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{log.care_type.replace('_', ' ')}</p>
                    {log.notes && <p className="text-xs text-stone-500">{log.notes}</p>}
                  </div>
                  <p className="text-xs text-stone-400">{format(new Date(log.log_date), 'MMM d')}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
