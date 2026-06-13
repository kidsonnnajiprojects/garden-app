'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { GardenPhoto, Plant } from '@/lib/supabase'
import { Camera, Upload, X, Loader } from 'lucide-react'
import { format } from 'date-fns'

export default function PhotosPage() {
  const [photos, setPhotos] = useState<(GardenPhoto & { plants?: { name: string } | null })[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [uploading, setUploading] = useState(false)
  const [diagnosing, setDiagnosing] = useState(false)
  const [selected, setSelected] = useState<GardenPhoto | null>(null)
  const [form, setForm] = useState({ plant_id: '', notes: '' })
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const [photosRes, plantsRes] = await Promise.all([
      supabase.from('garden_photos').select('*, plants(name)').order('taken_date', { ascending: false }),
      supabase.from('plants').select('*').eq('active', true).order('name'),
    ])
    setPhotos(photosRes.data ?? [])
    setPlants(plantsRes.data ?? [])
  }

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const upload = async () => {
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('garden-photos').upload(path, file)
    if (upErr) { setUploading(false); return }

    const { data: urlData } = supabase.storage.from('garden-photos').getPublicUrl(path)
    await supabase.from('garden_photos').insert({
      photo_url: urlData.publicUrl,
      plant_id: form.plant_id || null,
      notes: form.notes || null,
      taken_date: new Date().toISOString().split('T')[0],
    })
    setUploading(false)
    setFile(null)
    setPreview(null)
    setForm({ plant_id: '', notes: '' })
    load()
  }

  const diagnose = async (photo: GardenPhoto) => {
    setDiagnosing(true)
    const res = await fetch(photo.photo_url)
    const blob = await res.blob()
    const fd = new FormData()
    fd.append('image', blob, 'photo.jpg')
    if (photo.notes) fd.append('notes', photo.notes)

    const r = await fetch('/api/diagnose', { method: 'POST', body: fd })
    const { diagnosis } = await r.json()
    await supabase.from('garden_photos').update({ ai_diagnosis: diagnosis }).eq('id', photo.id)
    setDiagnosing(false)
    setSelected({ ...photo, ai_diagnosis: diagnosis })
    load()
  }

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-2xl font-bold text-green-800 pt-4">Photo Album</h1>

      {preview ? (
        <div className="space-y-3">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full rounded-xl object-cover max-h-64" />
            <button onClick={() => { setPreview(null); setFile(null) }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
              <X size={16} />
            </button>
          </div>
          <select value={form.plant_id} onChange={e => setForm(f => ({ ...f, plant_id: e.target.value }))}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm">
            <option value="">No specific plant</option>
            {plants.map(p => <option key={p.id} value={p.id}>{p.name}{p.variety ? ` (${p.variety})` : ''}</option>)}
          </select>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)" className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" />
          <button onClick={upload} disabled={uploading} className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
            {uploading ? 'Uploading…' : 'Save Photo'}
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-stone-300 rounded-xl py-8 flex flex-col items-center gap-2 text-stone-400 active:bg-stone-50">
          <Camera size={28} />
          <span className="text-sm">Take or choose a photo</span>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
        </button>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col p-4" onClick={() => setSelected(null)}>
          <button className="self-end text-white mb-2"><X size={24} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.photo_url} alt="" className="w-full rounded-xl object-contain max-h-64" onClick={e => e.stopPropagation()} />
          {selected.ai_diagnosis && (
            <div className="bg-white rounded-xl mt-3 p-4 overflow-y-auto flex-1" onClick={e => e.stopPropagation()}>
              <p className="font-semibold text-green-800 mb-2">AI Diagnosis</p>
              <p className="text-sm whitespace-pre-wrap">{selected.ai_diagnosis}</p>
            </div>
          )}
          {!selected.ai_diagnosis && (
            <button onClick={e => { e.stopPropagation(); diagnose(selected) }} disabled={diagnosing}
              className="mt-3 bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {diagnosing ? <><Loader size={16} className="animate-spin" /> Analyzing…</> : 'Diagnose with AI'}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {photos.map(photo => (
          <button key={photo.id} onClick={() => setSelected(photo)} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
            {photo.ai_diagnosis && (
              <div className="absolute top-1.5 right-1.5 bg-green-600 rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs font-medium truncate">{(photo as { plants?: { name: string } | null }).plants?.name ?? 'Garden'}</p>
              <p className="text-white/70 text-xs">{format(new Date(photo.taken_date), 'MMM d')}</p>
            </div>
          </button>
        ))}
      </div>

      {photos.length === 0 && !preview && (
        <p className="text-center text-stone-400 text-sm py-6">No photos yet. Take your first one!</p>
      )}
    </div>
  )
}
