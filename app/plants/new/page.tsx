'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPlantPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    variety: '',
    type: 'starter' as 'seed' | 'starter',
    category: 'vegetable' as 'vegetable' | 'herb' | 'flower' | 'other',
    location: '',
    planted_date: new Date().toISOString().split('T')[0],
    expected_germination_days: '',
    expected_days_to_maturity: '',
    notes: '',
  })

  const save = async () => {
    if (!form.name) return
    setSaving(true)
    const { error } = await supabase.from('plants').insert({
      ...form,
      expected_germination_days: form.expected_germination_days ? parseInt(form.expected_germination_days) : null,
      expected_days_to_maturity: form.expected_days_to_maturity ? parseInt(form.expected_days_to_maturity) : null,
      variety: form.variety || null,
      location: form.location || null,
      notes: form.notes || null,
    })
    setSaving(false)
    if (!error) window.location.href = '/'
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-4">
        <Link href="/" className="text-stone-500"><ChevronLeft size={24} /></Link>
        <h1 className="text-xl font-bold text-green-800">Add Plant</h1>
      </div>

      {field('Plant Name *', 'name', 'text', 'e.g. Tomato, Basil, Marigold')}
      {field('Variety', 'variety', 'text', 'e.g. Cherokee Purple, Genovese')}

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

      {field('Location', 'location', 'text', 'e.g. Front raised bed, Pot on porch')}
      {field('Date Planted', 'planted_date', 'date')}
      {form.type === 'seed' && field('Expected Days to Germinate', 'expected_germination_days', 'number', 'e.g. 7')}
      {field('Expected Days to Maturity / Harvest', 'expected_days_to_maturity', 'number', 'e.g. 75')}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Any other details..."
          rows={3}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      <button onClick={save} disabled={saving || !form.name}
        className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Plant'}
      </button>
    </div>
  )
}
