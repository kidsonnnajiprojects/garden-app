'use client'
import { useState } from 'react'
import { Send, Lightbulb } from 'lucide-react'

const starters = [
  'What should I be doing right now for my summer garden?',
  'Which of my plants are at risk from the Texas heat?',
  'What can I plant for a fall garden in Carrollton, TX?',
  'How often should I water containers in hot weather?',
  'What vegetables grow well in raised beds here in summer?',
]

export default function CoachPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const ask = async (question: string) => {
    if (!question.trim() || loading) return
    const q = question.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', content: q }])
    setLoading(true)

    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let text = ''
    setMessages(m => [...m, { role: 'assistant', content: '' }])
    setLoading(false)

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
      setMessages(m => {
        const next = [...m]
        next[next.length - 1] = { role: 'assistant', content: text }
        return next
      })
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 pb-0">
        <h1 className="text-2xl font-bold text-green-800 pt-4">Garden Coach</h1>
        <p className="text-sm text-stone-500">AI advisor for Carrollton, TX gardens</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-36">
        {messages.length === 0 && (
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-2 text-stone-500">
              <Lightbulb size={16} />
              <span className="text-sm font-medium">Try asking:</span>
            </div>
            {starters.map(s => (
              <button key={s} onClick={() => ask(s)}
                className="w-full text-left bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-700 active:bg-stone-50">
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
              m.role === 'user'
                ? 'bg-green-700 text-white'
                : 'bg-white border border-stone-200 text-stone-800'
            }`}>
              {m.content || <span className="text-stone-400 animate-pulse">Thinking…</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-stone-50 border-t border-stone-200 p-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask(input)}
            placeholder="Ask your garden coach…"
            className="flex-1 border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button onClick={() => ask(input)} disabled={!input.trim() || loading}
            className="bg-green-700 text-white p-2.5 rounded-xl disabled:opacity-40">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
