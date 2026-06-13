'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Droplets, Zap, Check } from 'lucide-react'

export default function CareAllButtons({ plantIds }: { plantIds: string[] }) {
  const [done, setDone] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const logAll = async (type: 'watering' | 'fertilizing') => {
    if (!plantIds.length) return
    setLoading(type)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('care_logs').insert(
      plantIds.map(id => ({ plant_id: id, care_type: type, log_date: today }))
    )
    setLoading(null)
    setDone(type)
    setTimeout(() => { setDone(null); window.location.reload() }, 1500)
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => logAll('watering')} disabled={!!loading || !plantIds.length}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${done === 'watering' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 active:bg-blue-200'} disabled:opacity-40`}>
        {done === 'watering' ? <><Check size={15} /> All Watered!</> : <><Droplets size={15} /> Water All</>}
        {loading === 'watering' && '…'}
      </button>
      <button onClick={() => logAll('fertilizing')} disabled={!!loading || !plantIds.length}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${done === 'fertilizing' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700 active:bg-yellow-200'} disabled:opacity-40`}>
        {done === 'fertilizing' ? <><Check size={15} /> All Fertilized!</> : <><Zap size={15} /> Fertilize All</>}
        {loading === 'fertilizing' && '…'}
      </button>
    </div>
  )
}
