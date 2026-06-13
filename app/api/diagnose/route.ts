import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const image = formData.get('image') as File
  const notes = formData.get('notes') as string

  const bytes = await image.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = image.type as 'image/jpeg' | 'image/png' | 'image/webp'

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        {
          type: 'text',
          text: `This is a photo of a home garden plant in Carrollton, Texas (zone 8a, hot humid summers). ${notes ? `Additional notes: ${notes}` : ''}

Please:
1. Identify any visible issues (diseases, pests, nutrient deficiencies, heat stress, overwatering, underwatering)
2. Rate severity: Minor / Moderate / Serious
3. Give 2-3 specific action steps to address the issue
4. Note if the plant looks healthy

Be concise and practical.`
        }
      ]
    }]
  })

  const text = (message.content[0] as { type: string; text: string }).text
  return Response.json({ diagnosis: text })
}
