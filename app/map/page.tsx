'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Plant } from '@/lib/supabase'
import { X, Copy, Clipboard, Trash2 } from 'lucide-react'

const ROWS = 15
const COLS = 15

type MapCell = {
  id: string
  row: number
  col: number
  plant_id: string | null
  label: string | null
}

const categoryColors: Record<string, string> = {
  vegetable: 'bg-green-200 border-green-400 text-green-900',
  herb: 'bg-purple-200 border-purple-400 text-purple-900',
  flower: 'bg-pink-200 border-pink-400 text-pink-900',
  other: 'bg-stone-200 border-stone-400 text-stone-900',
}

const categoryBg: Record<string, string> = {
  vegetable: '#bbf7d0',
  herb: '#e9d5ff',
  flower: '#fbcfe8',
  other: '#e7e5e4',
}

export default function MapPage() {
  const [cells, setCells] = useState<MapCell[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null)
  const [copied, setCopied] = useState<MapCell | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const [cellsRes, plantsRes] = await Promise.all([
      supabase.from('garden_map').select('*'),
      supabase.from('plants').select('*').eq('active', true).order('name'),
    ])
    setCells(cellsRes.data ?? [])
    setPlants(plantsRes.data ?? [])
  }

  const getCell = (row: number, col: number) =>
    cells.find(c => c.row === row && c.col === col) ?? null

  const getPlant = (plantId: string | null) =>
    plants.find(p => p.id === plantId) ?? null

  const handleCellTap = async (row: number, col: number) => {
    const cell = getCell(row, col)

    if (copied) {
      if (copied.row === row && copied.col === col) {
        setCopied(null)
        return
      }
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

  const startCopy = (cell: MapCell) => {
    setCopied(cell)
    setSelected(null)
  }

  const colLabels = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i))
  const rowLabels = Array.from({ length: ROWS }, (_, i) => i + 1)

  const selectedCell = selected ? getCell(selected.row, selected.col) : null
  const selectedPlant = selectedCell ? getPlant(selectedCell.plant_id) : null

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between pt-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-green-800">Garden Map</h1>
          <p className="text-xs text-stone-500 mt-0.5">Tap cell to place plant · Tap filled cell to copy</p>
        </div>
        {copied && (
          <button onClick={() => setCopied(null)}
            className="flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-full font-medium">
            <Clipboard size={13} />
            Copying: {getPlant(copied.plant_id)?.name ?? '?'} · Cancel
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {Object.entries(categoryColors).map(([cat, cls]) => (
          <div key={cat} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${cls}`}>
            {cat}
          </div>
        ))}
      </div>

      <div className="overflow-auto border border-stone-200 rounded-xl bg-white">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-6 h-6 sticky left-0 bg-white z-10" />
              {colLabels.map(l => (
                <th key={l} className="w-14 h-6 text-center text-stone-400 font-medium sticky top-0 bg-white z-10">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map(row => (
              <tr key={row}>
                <td className="sticky left-0 bg-white z-10 text-center text-stone-400 font-medium w-6 pr-1">{row}</td>
                {colLabels.map((_, colIdx) => {
                  const cell = getCell(row - 1, colIdx)
                  const plant = cell ? getPlant(cell.plant_id) : null
                  const isCopied = copied?.row === row - 1 && copied?.col === colIdx
                  const isSelected = selected?.row === row - 1 && selected?.col === colIdx

                  return (
                    <td key={colIdx}
                      onClick={() => handleCellTap(row - 1, colIdx)}
                      className={`w-14 h-14 border border-stone-100 cursor-pointer transition-all relative
                        ${isSelected ? 'ring-2 ring-green-500 ring-inset' : ''}
                        ${isCopied ? 'ring-2 ring-amber-400 ring-inset' : ''}
                        ${!plant ? 'hover:bg-stone-50 active:bg-stone-100' : 'active:opacity-70'}
                      `}
                      style={plant ? { backgroundColor: categoryBg[plant.category] ?? categoryBg.other } : {}}
                    >
                      {plant && (
                        <div className="p-0.5 h-full flex flex-col justify-center items-center text-center leading-tight">
                          <span className="text-[10px] font-medium line-clamp-3">{plant.name}</span>
                          {plant.variety && <span className="text-[9px] opacity-70 line-clamp-1">{plant.variety}</span>}
                        </div>
                      )}
                      {isCopied && (
                        <div className="absolute inset-0 flex items-center justify-center bg-amber-200/50">
                          <Copy size={14} className="text-amber-700" />
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-h-[70vh] rounded-t-2xl p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-800">
                Cell {colLabels[selected.col]}{selected.row + 1}
                {selectedPlant ? ` — ${selectedPlant.name}` : ''}
              </h2>
              <button onClick={() => setSelected(null)}><X size={20} /></button>
            </div>

            {selectedCell && (
              <div className="flex gap-2 mb-4">
                <button onClick={() => startCopy(selectedCell)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 py-2 rounded-lg text-sm">
                  <Copy size={14} /> Copy to other cells
                </button>
                <button onClick={() => assignPlant(null)} disabled={saving}
                  className="flex items-center justify-center gap-1.5 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                  <Trash2 size={14} /> Clear
                </button>
              </div>
            )}

            <p className="text-xs text-stone-400 mb-2 font-medium uppercase">Assign a plant</p>
            <div className="space-y-1">
              {plants.map(plant => (
                <button key={plant.id} onClick={() => assignPlant(plant.id)} disabled={saving}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 transition-colors
                    ${selectedCell?.plant_id === plant.id ? 'bg-green-100 border border-green-300' : 'hover:bg-stone-50 border border-transparent'}`}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoryBg[plant.category] ?? categoryBg.other }} />
                  <div>
                    <span className="text-sm font-medium">{plant.name}</span>
                    {plant.variety && <span className="text-xs text-stone-400 ml-1">{plant.variety}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
