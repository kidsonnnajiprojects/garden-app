'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Droplets, Zap, Scissors, Bug, Check } from 'lucide-react'

const careTypes = [
  { type: 'watering', label: 'Water', icon: Droplets, color: 'bg-blue-100 text-blue-700 active:bg-blue-200' },
  { type: 'fertilizing', label: 'Fertilize', icon: Zap, color: 'bg-yellow-100 text-yellow-700 active:bg-yellow-200' },
  { type: 'pruning', label: 'Prune', icon: Scissors, color: 'bg-green-100 text-green-700 active:bg-green-200' },
  { type: 'pest_treatment', label: 'Pest Tx', icon: Bug, color: 'bg-red-100 text-red-700 active:bg-red-200' },
]

export default function QuickCareButtons({ plantId }: { plantId: string }) {
  const router = useRouter()
  const [logged, setLogged] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const log = async (type: string) => {
    setLoading(type)
    await supabase.from('care_logs').insert({
      plant_id: plantId,
      care_type: type,
      log_date: new Date().toISOString().split('T')[0],
    })
    setLogged(type)
    setLoading(null)
    setTimeout(() => { setLogged(null); router.refresh() }, 1500)
  }

  return (
    <div>
      <h2 className="font-semibold text-stone-700 mb-3">Log Care</h2>
      <div className="grid grid-cols-4 gap-2">
        {careTypes.map(({ type, label, icon: Icon, color }) => {
          const isLogged = logged === type
          return (
            <button key={type} onClick={() => log(type)} disabled={!!loading}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all ${color} ${isLogged ? 'scale-95' : ''}`}>
              {isLogged ? <Check size={20} /> : <Icon size={20} />}
              {isLogged ? 'Done!' : label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
