import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { getCurrentWeather } from '@/lib/weather'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { question } = await req.json()

  const [plantsRes, weather] = await Promise.all([
    supabase.from('plants').select('*').eq('active', true),
    getCurrentWeather().catch(() => null),
  ])

  const plants = plantsRes.data ?? []
  const plantSummary = plants.map(p =>
    `- ${p.name}${p.variety ? ` (${p.variety})` : ''}, ${p.category}, planted ${p.planted_date ?? 'unknown'}, in ${p.location ?? 'unspecified location'}`
  ).join('\n')

  const systemPrompt = `You are a knowledgeable home garden coach for a gardener in Carrollton, Texas (zone 8a, 75010).
It is currently mid-to-late season (June 2026) with rapidly rising temperatures and the rainy season ending.
The garden has vegetables, herbs, and flowers in containers and raised beds.

Current garden:
${plantSummary || 'No plants logged yet.'}

${weather ? `Current weather: ${Math.round(weather.temp_f)}°F, ${weather.description}, ${weather.humidity}% humidity` : ''}

Give practical, specific advice for this location and setup. Be friendly but concise. Focus on actionable tips.`

  const stream = await anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
}
