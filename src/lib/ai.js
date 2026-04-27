// ═══════════════════════════════════════════════════════════════
// ai.js — Modular AI provider switchboard
// To swap providers, only change PROVIDER below.
// ═══════════════════════════════════════════════════════════════

const PROVIDER = {
  transcription: 'webspeech',  // 'webspeech' | 'whisper'
  notes: 'gemini',             // 'local' | 'gemini' | 'openai' | 'claude'
}

// ── Transcription ─────────────────────────────────────────────

export function startTranscription({ onTranscript, onError }) {
  if (PROVIDER.transcription === 'webspeech') return startWebSpeech({ onTranscript, onError })
  throw new Error(`Unknown transcription provider: ${PROVIDER.transcription}`)
}

function startWebSpeech({ onTranscript, onError }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    onError(new Error('Speech recognition not supported. Use Chrome or Edge.'))
    return null
  }
  const recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'
  recognition.maxAlternatives = 1

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript
      const isFinal = event.results[i].isFinal
      onTranscript(text, isFinal)
    }
  }
  recognition.onerror = (event) => {
    if (event.error === 'no-speech') return
    onError(new Error(`Speech recognition error: ${event.error}`))
  }
  recognition.onend = () => {
    try { recognition.start() } catch (_) {}
  }
  recognition.start()
  return {
    stop: () => {
      recognition.onend = null
      recognition.stop()
    },
  }
}

// ── Note Generation ───────────────────────────────────────────

export async function generateNotes({ transcript, existingNotes, sessionTitle }) {
  if (!transcript?.trim()) return existingNotes || ''
  if (PROVIDER.notes === 'gemini') return generateWithGemini({ transcript, existingNotes, sessionTitle })
  if (PROVIDER.notes === 'claude') return generateWithClaude({ transcript, existingNotes, sessionTitle })
  if (PROVIDER.notes === 'openai') return generateWithOpenAI({ transcript, existingNotes, sessionTitle })
  return generateLocally({ transcript, existingNotes, sessionTitle })
}

// ── Local (free, no API) ──────────────────────────────────────
function generateLocally({ transcript, existingNotes, sessionTitle }) {
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const newChunk = `### [${timestamp}]\n${transcript.trim()}\n`
  if (!existingNotes) return `# Notes — ${sessionTitle}\n\n## Transcript\n\n${newChunk}`
  return `${existingNotes}\n${newChunk}`
}

// ── Gemini (free tier) ────────────────────────────────────────
async function generateWithGemini({ transcript, existingNotes, sessionTitle }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set in .env')

  const isFirst = !existingNotes
  const prompt = isFirst
    ? `You are a study notes assistant. Create clean structured markdown notes from this lecture transcript. Return notes only, no preamble.\n\nLecture: "${sessionTitle}"\n\nTranscript:\n---\n${transcript}\n---\n\nCreate notes with:\n## Key Concepts\n## Detailed Notes\n## Important Terms\n## Summary So Far`
    : `You are a study notes assistant. Update the existing notes with new transcript content. Return full updated notes only, no preamble.\n\nLecture: "${sessionTitle}"\n\nEXISTING NOTES:\n---\n${existingNotes}\n---\n\nNEW TRANSCRIPT:\n---\n${transcript}\n---\n\nUpdate and expand. Same structure, don't repeat covered points.`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1500, temperature: 0.3 },
      }),
    }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates?.[0]?.content?.parts?.[0]?.text || existingNotes || ''
}

// ── OpenAI ────────────────────────────────────────────────────
async function generateWithOpenAI({ transcript, existingNotes, sessionTitle }) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('VITE_OPENAI_API_KEY not set in .env')

  const isFirst = !existingNotes
  const prompt = isFirst
    ? `Lecture: "${sessionTitle}"\n\nTranscript:\n---\n${transcript}\n---\n\nCreate structured study notes with:\n## Key Concepts\n## Detailed Notes\n## Important Terms\n## Summary So Far`
    : `Lecture: "${sessionTitle}"\n\nEXISTING NOTES:\n---\n${existingNotes}\n---\n\nNEW TRANSCRIPT:\n---\n${transcript}\n---\n\nUpdate and expand. Keep same structure, don't repeat covered points. Return full updated notes.`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: 'You are a study notes assistant. Return structured markdown notes only.' },
        { role: 'user', content: prompt },
      ],
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices?.[0]?.message?.content || existingNotes || ''
}

// ── Claude ────────────────────────────────────────────────────
async function generateWithClaude({ transcript, existingNotes, sessionTitle }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY not set in .env')

  const isFirst = !existingNotes
  const userPrompt = isFirst
    ? `Lecture: "${sessionTitle}"\n\nTranscript:\n---\n${transcript}\n---\n\nCreate structured study notes with:\n## Key Concepts\n## Detailed Notes\n## Important Terms\n## Summary So Far`
    : `Lecture: "${sessionTitle}"\n\nEXISTING NOTES:\n---\n${existingNotes}\n---\n\nNEW TRANSCRIPT:\n---\n${transcript}\n---\n\nUpdate and expand. Keep same structure, don't repeat covered points. Return full updated notes.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content?.[0]?.text || existingNotes || ''
}

export const AI_PROVIDER = PROVIDER