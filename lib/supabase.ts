import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Plant = {
  id: string
  name: string
  variety: string | null
  type: 'seed' | 'starter'
  category: 'vegetable' | 'herb' | 'flower' | 'other'
  location: string | null
  planted_date: string | null
  germination_date: string | null
  expected_germination_days: number | null
  first_harvest_date: string | null
  expected_days_to_maturity: number | null
  notes: string | null
  active: boolean
  created_at: string
}

export type CareLog = {
  id: string
  plant_id: string
  log_date: string
  care_type: 'watering' | 'fertilizing' | 'pruning' | 'pest_treatment' | 'other'
  notes: string | null
  created_at: string
}

export type GardenPhoto = {
  id: string
  plant_id: string | null
  photo_url: string
  taken_date: string
  notes: string | null
  ai_diagnosis: string | null
  created_at: string
}

export type Observation = {
  id: string
  plant_id: string
  observed_date: string
  observation_type: 'leaf_color' | 'pest' | 'soil_ph' | 'disease' | 'other'
  description: string
  ai_suggestion: string | null
  created_at: string
}
