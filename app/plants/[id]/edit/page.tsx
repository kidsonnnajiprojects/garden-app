'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditPlantPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '',
    variety: '',
    type: 'starter' as 'seed' | 'starter',
    category: 'vegetable' as 'vegetable' | 'herb' | 'flower' | 'other',
    location: '',
    planted_date: '',
    germination_date: '',
    first_harvest_date: '',
    expected_germination_days: '',
    expected_days_to_maturity: '',
    notes: '',
    active: true,
  })

  useEffect(() => {
    supabase.from('plants').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name ?? '',
          variety: data.variety ?? '',
          type: data.type ?? 'starter',
          category: data.category ?? 'vegetable',
          location: data.location ?? '',
          planted_date: data.planted_date ?? '',
          germination_date: data.germination_date ?? '',
          first_harvest_date: data.first_harvest_date ?? '',
          expected_germination_days: data.expected_germination_days?.toString() ?? '',
          expected_days_to_maturity: data.expected_days_to_maturity?.toString() ?? '',
          notes: data.notes ?? '',
          active: data.active ?? true,
        })
      }
      setLoading(false)
    })
  }, [id])

  const save = async () => {
    if (!form.name) return
    setSaving(true)
    await supabase.from('plants').update({
      ...form,
      variety: form.variety || null,
      location: form.location || null,
      planted_date: form.planted_date || null,
      germination_date: form.germination_date || null,
      first_harvest_date: form.first_harvest_date || null,
      notes: form.notes || null,
      expected_germination_days: form.expected_germination_days ? parseInt(form.expected_germination_days) : null,
      expected_days_to_maturity: form.expected_days_to_maturity ? parseInt(form.expected_days_to_maturity) : null,
    }).eq('id', id)
    setSaving(false)
    window.location.href = `/plants/${id}`
  }

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  )

  if (loading) return <div className="p-8 text-center text-stone-400">Loading…</div>

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-4">
        <Link href={`/plants/${id}`} className="text-stone-500"><ChevronLeft size={24} /></Link>
        <h1 className="text-xl font-bold text-green-800">Edit Plant</h1>
      </div>

      {field('Plant Name *', 'name', 'text', 'e.g. Tomato, Basil')}
      {field('Variety', 'variety', 'text', 'e.g. Cherokee Purple')}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as typeof form.category }))}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="vegetable">Vegetable</option>
          <option value="herb">Herb</option>
          <option value="flower">Flower</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Started From</label>
        <div className="flex gap-3">
          {(['seed', 'starter'] as const).map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === t ? 'bg-green-700 text-white border-green-700' : 'border-stone-300 text-stone-600'}`}>
              {t === 'seed' ? 'Seed' : 'Starter / Transplant'}
            </button>
          ))}
        </div>
      </div>

      {field('Location', 'location', 'text', 'e.g. Front raised bed')}
      {field('Date Planted', 'planted_date', 'date')}
      {field('Germination Date (actual)', 'germination_date', 'date')}
      {field('First Harvest Date (actual)', 'first_harvest_date', 'date')}
      {form.type === 'seed' && field('Expected Days to Germinate', 'expected_germination_days', 'number', 'e.g. 7')}
      {field('Expected Days to Maturity', 'expected_days_to_maturity', 'number', 'e.g. 75')}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={3} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      <div className="flex items-center gap-3 py-1">
        <input type="checkbox" id="active" checked={form.active}
          onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
          className="w-4 h-4 accent-green-700" />
        <label htmlFor="active" className="text-sm text-stone-700">Plant is still active</label>
      </div>

      <button onClick={save} disabled={saving || !form.name}
        className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
