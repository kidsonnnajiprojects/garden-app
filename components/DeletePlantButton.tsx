'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2 } from 'lucide-react'

export default function DeletePlantButton({ plantId }: { plantId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const deletePlant = async () => {
    setDeleting(true)
    await supabase.from('plants').delete().eq('id', plantId)
    window.location.href = '/'
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button onClick={() => setConfirming(false)}
          className="flex-1 border border-stone-300 text-stone-600 py-2.5 rounded-xl text-sm font-medium">
          Cancel
        </button>
        <button onClick={deletePlant} disabled={deleting}
          className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-medium">
      <Trash2 size={16} /> Delete Plant
    </button>
  )
}
