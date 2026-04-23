// ═══════════════════════════════════════════════════════════════
// ai.js — Modular AI provider switchboard
//
// To swap providers later, only change the PROVIDER config below.
// All components import from here — nothing breaks downstream.
// ═══════════════════════════════════════════════════════════════

const PROVIDER = {
  transcription: 'webspeech',   // 'webspeech' | 'whisper'
  notes: 'local',               // 'local' | 'claude' | 'openai'
}

// ── Transcription ─────────────────────────────────────────────

/**
 * Start live speech recognition. Returns a controller object.
 * onTranscript(text, isFinal) called continuously.
 * onError(err) called on failure.
 */
export function startTranscription({ onTranscript, onError }) {
  if (PROVIDER.transcription === 'webspeech') {
    return startWebSpeech({ onTranscript, onError })
  }
  // Future: if (PROVIDER.transcription === 'whisper') return startWhisper(...)
  throw new Error(`Unknown transcription provider: ${PROVIDER.transcription}`)
}

function startWebSpeech({ onTranscript, onError }) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    onError(new Error('Speech recognition is not supported in this browser. Try Chrome or Edge.'))
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
    // 'no-speech' is harmless — just silence, keep going
    if (event.error === 'no-speech') return
    onError(new Error(`Speech recognition error: ${event.error}`))
  }

  recognition.onend = () => {
    // Auto-restart if it stops (browser stops after ~60s of silence)
    try { recognition.start() } catch (_) {}
  }

  recognition.start()

  return {
    stop: () => {
      recognition.onend = null // prevent auto-restart
      recognition.stop()
    },
  }
}

// ── Note Generation ───────────────────────────────────────────

/**
 * Generate structured notes from a transcript.
 * existingNotes: string | null (if null, this is the first chunk)
 * sessionTitle: string
 * Returns: string (markdown notes)
 */
export async function generateNotes({ transcript, existingNotes, sessionTitle }) {
  if (!transcript?.trim()) return existingNotes || ''

  if (PROVIDER.notes === 'claude') {
    return generateWithClaude({ transcript, existingNotes, sessionTitle })
  }

  // Future: if (PROVIDER.notes === 'openai') return generateWithOpenAI(...)

  // Default: local structured formatting (free, no API needed)
  return generateLocally({ transcript, existingNotes, sessionTitle })
}

// ── Local generator (free, no API) ───────────────────────────
function generateLocally({ transcript, existingNotes, sessionTitle }) {
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const newChunk = `### [${timestamp}]\n${transcript.trim()}\n`

  if (!existingNotes) {
    return `# Notes — ${sessionTitle}\n\n## Transcript\n\n${newChunk}`
  }

  return `${existingNotes}\n${newChunk}`
}

// ── Claude API generator (plug in API key to activate) ────────
async function generateWithClaude({ transcript, existingNotes, sessionTitle }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY not set in .env')

  const isFirst = !existingNotes

  const userPrompt = isFirst
    ? `Lecture: "${sessionTitle}"

Transcript:
---
${transcript}
---

Create structured study notes with:
## Key Concepts
## Detailed Notes
## Important Terms
## Summary So Far`
    : `Lecture: "${sessionTitle}"

EXISTING NOTES:
---
${existingNotes}
---

NEW TRANSCRIPT:
---
${transcript}
---

Update and expand the notes with new content. Keep same structure, don't repeat covered points. Return full updated notes.`

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