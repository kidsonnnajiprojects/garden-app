'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Plant } from '@/lib/supabase'
import { X, Copy, Trash2 } from 'lucide-react'

const ROWS = 15
const COLS = 15

type MapCell = {
  id: string
  row: number
  col: number
  plant_id: string | null
  label: string | null
}

const categoryBg: Record<string, string> = {
  vegetable: '#bbf7d0',
  herb: '#e9d5ff',
  flower: '#fbcfe8',
  other: '#e7e5e4',
}

const colLabels = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i))

export default function MapPage() {
  const [cells, setCells] = useState<MapCell[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null)
  const [copied, setCopied] = useState<MapCell | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const [cellsRes, plantsRes] = await Promise.all([
      supabase.from('garden_map').select('*'),
      supabase.from('plants').select('*').eq('active', true).order('name'),
    ])
    setCells(cellsRes.data ?? [])
    setPlants(plantsRes.data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  const getCell = (row: number, col: number) =>
    cells.find(c => c.row === row && c.col === col) ?? null

  const getPlant = (plantId: string | null) =>
    plants.find(p => p.id === plantId) ?? null

  const handleCellTap = async (row: number, col: number) => {
    const cell = getCell(row, col)

    if (copied) {
      if (copied.row === row && copied.col === col) { setCopied(null); return }
      setSaving(true)
      if (cell) {
        await supabase.from('garden_map').update({ plant_id: copied.plant_id, label: copied.label }).eq('id', cell.id)
      } else {
        await supabase.from('garden_map').insert({ row, col, plant_id: copied.plant_id, label: copied.label })
      }
      setSaving(false)
      await load()
      return
    }

    setSelected({ row, col })
  }

  const assignPlant = async (plantId: string | null) => {
    if (!selected) return
    setSaving(true)
    const cell = getCell(selected.row, selected.col)
    if (cell) {
      if (plantId === null) {
        await supabase.from('garden_map').delete().eq('id', cell.id)
      } else {
        await supabase.from('garden_map').update({ plant_id: plantId }).eq('id', cell.id)
      }
    } else if (plantId !== null) {
      await supabase.from('garden_map').insert({ row: selected.row, col: selected.col, plant_id: plantId })
    }
    setSaving(false)
    setSelected(null)
    await load()
  }

  const selectedCell = selected ? getCell(selected.row, selected.col) : null
  const selectedPlant = selectedCell ? getPlant(selectedCell.plant_id) : null

  return (
    <div className="p-3 pb-24">
      <div className="flex items-center justify-between pt-4 mb-3">
        <div>
          <h1 className="text-2xl font-bold text-green-800">Garden Map</h1>
          <p className="text-xs text-stone-500 mt-0.5">Tap cell to place · Tap filled cell to copy</p>
        </div>
        {copied && (
          <button onTouchEnd={e => { e.preventDefault(); setCopied(null) }}
            onClick={() => setCopied(null)}
            className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-full font-medium">
            Copying: {getPlant(copied.plant_id)?.name ?? '?'} · Cancel
          </button>
        )}
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        {Object.entries(categoryBg).map(([cat, bg]) => (
          <div key={cat} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-stone-200">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bg }} />
            {cat}
          </div>
        ))}
      </div>

      <div className="overflow-auto border border-stone-200 rounded-xl bg-white">
        <div className="inline-block min-w-full">
          {/* Column headers */}
          <div className="flex sticky top-0 bg-white z-10 border-b border-stone-100">
            <div className="w-6 flex-shrink-0" />
            {colLabels.map(l => (
              <div key={l} className="w-12 flex-shrink-0 text-center text-xs text-stone-400 py-1 font-medium">{l}</div>
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: ROWS }, (_, rowIdx) => (
            <div key={rowIdx} className="flex border-b border-stone-100 last:border-0">
              <div className="w-6 flex-shrink-0 flex items-center justify-center text-xs text-stone-400 font-medium border-r border-stone-100">
                {rowIdx + 1}
              </div>
              {Array.from({ length: COLS }, (_, colIdx) => {
                const cell = getCell(rowIdx, colIdx)
                const plant = cell ? getPlant(cell.plant_id) : null
                const isCopied = copied?.row === rowIdx && copied?.col === colIdx
                const isSelected = selected?.row === rowIdx && selected?.col === colIdx

                return (
                  <div
                    key={colIdx}
                    onTouchEnd={e => { e.preventDefault(); handleCellTap(rowIdx, colIdx) }}
                    onClick={() => handleCellTap(rowIdx, colIdx)}
                    className={`w-12 h-12 flex-shrink-0 border-r border-stone-100 last:border-0 cursor-pointer flex items-center justify-center relative select-none
                      ${isSelected ? 'outline outline-2 outline-green-500' : ''}
                      ${isCopied ? 'outline outline-2 outline-amber-400' : ''}
                    `}
                    style={plant ? { backgroundColor: categoryBg[plant.category] ?? categoryBg.other } : {}}
                  >
                    {plant && (
                      <div className="p-0.5 text-center leading-tight">
                        <div className="text-[9px] font-medium line-clamp-3">{plant.name}</div>
                        {plant.variety && <div className="text-[8px] opacity-60 line-clamp-1">{plant.variety}</div>}
                      </div>
                    )}
                    {isCopied && (
                      <div className="absolute inset-0 flex items-center justify-center bg-amber-200/60">
                        <Copy size={12} className="text-amber-700" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onTouchEnd={e => { if (e.target === e.currentTarget) { e.preventDefault(); setSelected(null) } }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="bg-white w-full max-h-[72vh] rounded-t-2xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-800">
                {colLabels[selected.col]}{selected.row + 1}
                {selectedPlant ? ` — ${selectedPlant.name}` : ' — Empty'}
              </h2>
              <button onTouchEnd={e => { e.preventDefault(); setSelected(null) }} onClick={() => setSelected(null)}>
                <X size={20} />
              </button>
            </div>

            {selectedCell && (
              <div className="flex gap-2 mb-4">
                <button
                  onTouchEnd={e => { e.preventDefault(); setCopied(selectedCell); setSelected(null) }}
                  onClick={() => { setCopied(selectedCell); setSelected(null) }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 py-2 rounded-lg text-sm">
                  <Copy size={14} /> Copy to other cells
                </button>
                <button
                  onTouchEnd={e => { e.preventDefault(); assignPlant(null) }}
                  onClick={() => assignPlant(null)}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                  <Trash2 size={14} /> Clear
                </button>
              </div>
            )}

            <p className="text-xs text-stone-400 mb-2 font-medium uppercase tracking-wide">Assign a plant</p>
            <div className="space-y-1">
              {plants.map(plant => (
                <button key={plant.id}
                  onTouchEnd={e => { e.preventDefault(); assignPlant(plant.id) }}
                  onClick={() => assignPlant(plant.id)}
                  disabled={saving}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 active:opacity-70
                    ${selectedCell?.plant_id === plant.id ? 'bg-green-100 border border-green-300' : 'bg-stone-50 border border-transparent'}`}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoryBg[plant.category] ?? categoryBg.other }} />
                  <div>
                    <span className="text-sm font-medium">{plant.name}</span>
                    {plant.variety && <span className="text-xs text-stone-400 ml-1.5">{plant.variety}</span>}
                    {plant.location && <span className="text-xs text-stone-300 ml-1.5">· {plant.location}</span>}
                  </div>
                </button>
              ))}
              {plants.length === 0 && (
                <p className="text-stone-400 text-sm text-center py-4">No plants added yet. Add plants first from the Plants tab.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
