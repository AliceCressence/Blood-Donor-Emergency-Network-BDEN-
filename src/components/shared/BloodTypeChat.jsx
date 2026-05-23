// src/components/shared/BloodTypeChat.jsx
import { useState, useRef, useEffect } from 'react'
import { X, Send, Droplets, Loader2, Bot, User, AlertCircle } from 'lucide-react'

const SYSTEM_PROMPT = `You are BDEN's friendly blood type estimation assistant for Cameroon. 
Your job is to help donors estimate their probable blood type using basic genetics when they don't know it.

Rules:
- Ask 3-4 short, simple questions one at a time: parents' blood types (if known), any prior medical tests, siblings' blood types
- Use ABO/Rh genetics to estimate probabilities
- Give a clear answer like: "Based on your answers, you are most likely Type A+ (about 60% probability) or Type O+ (about 40% probability)"
- Always end by saying they should visit a screening center for official confirmation
- Be warm, encouraging, and conversational — many users are first-time donors
- Keep responses SHORT — max 3 sentences per message
- Never be discouraging — even "I don't know" answers are helpful
- Respond in the same language the user writes in (French or English)`

export default function BloodTypeChat({ onClose }) {
  const [messages, setMessages]   = useState([
    {
      role: 'assistant',
      content: "Hello! I'm BDEN's blood type assistant 🩸 I'll help estimate your blood type using a few simple questions. This takes about 2 minutes. Ready to start?",
    }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await response.json()
      const reply = data.content?.[0]?.text || "I'm sorry, I couldn't process that. Please try again."
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch {
      setError('Connection error. Please check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
           style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="bg-blood-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Droplets size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Blood type estimator</p>
              <p className="text-blood-200 text-xs">Powered by BDEN AI</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-start gap-2 flex-shrink-0">
          <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            This is an estimate only — not a medical diagnosis. Always confirm with an official blood test.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                ${m.role === 'assistant' ? 'bg-blood-100' : 'bg-warm-200'}`}>
                {m.role === 'assistant'
                  ? <Bot size={14} className="text-blood-600" />
                  : <User size={14} className="text-warm-600" />}
              </div>
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                ${m.role === 'assistant'
                  ? 'bg-warm-50 border border-warm-200 text-warm-800 rounded-tl-sm'
                  : 'bg-blood-600 text-white rounded-tr-sm'}`}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blood-100 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-blood-600" />
              </div>
              <div className="bg-warm-50 border border-warm-200 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-warm-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-blood-600 text-center bg-blood-50 border border-blood-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-warm-200 flex gap-2 flex-shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your answer..."
            className="flex-1 px-4 py-2.5 bg-warm-50 border border-warm-200 rounded-xl
                       text-sm text-warm-900 placeholder:text-warm-400
                       focus:outline-none focus:ring-2 focus:ring-blood-500 focus:border-blood-500"
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-blood-600 hover:bg-blood-700
                       flex items-center justify-center flex-shrink-0
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading
              ? <Loader2 size={16} className="text-white animate-spin" />
              : <Send size={16} className="text-white" />}
          </button>
        </div>
      </div>
    </div>
  )
}