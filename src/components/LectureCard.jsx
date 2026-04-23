import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { startTranscription, generateNotes } from '../lib/ai'
import { saveNotes, getNotesByLecture } from '../lib/notes'
import Btn from './ui/Btn'

function renderMarkdown(md) {
  if (!md) return ''
  return md
    .replace(/^# (.+)$/gm, '<h1 style="font-size:18px;margin:0 0 12px;font-family:var(--font-serif)">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:15px;margin:16px 0 8px;color:var(--text-primary)">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:13px;margin:12px 0 6px;color:var(--text-secondary)">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0;padding-left:4px">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin:6px 0 10px;padding-left:18px">$&</ul>')
    .replace(/\n\n/g, '<br/>')
}

function downloadNotesPDF(notes, title) {
  const html = `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>${title} — Notes</title>
    <style>
      body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; padding: 0 24px; color: #1c1410; line-height: 1.7; }
      h1 { font-size: 22px; border-bottom: 2px solid #c97d2e; padding-bottom: 8px; margin-bottom: 20px; }
      h2 { font-size: 16px; color: #5c4a36; margin-top: 24px; }
      h3 { font-size: 14px; color: #a08060; margin-top: 16px; }
      ul { padding-left: 20px; } li { margin: 4px 0; }
      p { margin: 8px 0; }
      .meta { font-size: 12px; color: #a08060; margin-bottom: 32px; }
    </style>
  </head><body>
    <h1>${title} — Lecture Notes</h1>
    <p class="meta">Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    ${renderMarkdown(notes)}
  </body></html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${title.replace(/\s+/g, '_')}_Notes.html`
  a.click()
  URL.revokeObjectURL(url)
}

function NotesPanel({ notes, title, onClose }) {
  return (
    <div style={{
      marginTop: 14, padding: '16px 18px',
      background: 'var(--accent-light)', borderRadius: 10,
      border: '1px solid var(--border-accent)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--accent-text)' }}>📝 AI Notes</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small onClick={() => downloadNotesPDF(notes, title)}>⬇ Download</Btn>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      </div>
      <div
        style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, maxHeight: 320, overflowY: 'auto' }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(notes) }}
      />
    </div>
  )
}

export default function LectureCard({ lecture }) {
  const { user } = useApp()
  const [playing, setPlaying]           = useState(false)
  const [notes, setNotes]               = useState(null)
  const [showNotes, setShowNotes]       = useState(false)
  const [isListening, setIsListening]   = useState(false)
  const [notesStatus, setNotesStatus]   = useState('')
  const [loadingNotes, setLoadingNotes] = useState(true)

  const transcriptRef   = useRef('')
  const recognizerRef   = useRef(null)
  const chunkTimerRef   = useRef(null)
  const currentNotesRef = useRef(null)

  const isYoutube = !lecture.video_type || lecture.video_type === 'youtube'

  useEffect(() => {
    if (!user?.id || !lecture?.id) return
    getNotesByLecture(lecture.id, user.id)
      .then(row => { if (row?.notes) { setNotes(row.notes); currentNotesRef.current = row.notes } })
      .catch(console.error)
      .finally(() => setLoadingNotes(false))
  }, [lecture.id, user?.id])

  useEffect(() => {
    return () => {
      recognizerRef.current?.stop()
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current)
    }
  }, [])

  async function processTranscriptChunk() {
    const chunk = transcriptRef.current.trim()
    if (!chunk) return
    transcriptRef.current = ''
    setNotesStatus('Generating notes…')
    try {
      const updated = await generateNotes({
        transcript: chunk,
        existingNotes: currentNotesRef.current,
        sessionTitle: lecture.title,
      })
      currentNotesRef.current = updated
      setNotes(updated)
      await saveNotes({ lectureId: lecture.id, userId: user.id, transcript: chunk, notes: updated })
      setNotesStatus('Notes updated ✓')
      setTimeout(() => setNotesStatus(''), 2000)
    } catch (e) {
      setNotesStatus('Error generating notes')
      console.error(e)
    }
  }

  function startListening() {
    transcriptRef.current = ''
    setIsListening(true)
    setNotesStatus('Listening…')
    const controller = startTranscription({
      onTranscript: (text, isFinal) => {
        if (isFinal) transcriptRef.current += ' ' + text
      },
      onError: (err) => {
        setNotesStatus(err.message)
        setIsListening(false)
        clearInterval(chunkTimerRef.current)
      },
    })
    recognizerRef.current = controller
    chunkTimerRef.current = setInterval(processTranscriptChunk, 2 * 60 * 1000)
  }

  async function stopListening() {
    recognizerRef.current?.stop()
    recognizerRef.current = null
    clearInterval(chunkTimerRef.current)
    setIsListening(false)
    await processTranscriptChunk()
    setShowNotes(true)
  }

  const dateStr = lecture.created_at
    ? new Date(lecture.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-dim)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 22px',
      marginBottom: 12,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: 'var(--accent-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>
          {isYoutube ? '▶' : '🎬'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
            {lecture.title}
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)' }}>
            {lecture.duration}{dateStr ? ` · ${dateStr}` : ''} · {isYoutube ? 'YouTube' : 'Uploaded'}
          </p>

          {playing && lecture.videoUrl && (
            <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', background: '#000', marginBottom: 12 }}>
              {isYoutube ? (
                <iframe
                  width="100%" height="100%"
                  src={lecture.videoUrl}
                  title={lecture.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ display: 'block' }}
                />
              ) : (
                <video src={lecture.videoUrl} controls style={{ width: '100%', height: '100%', display: 'block' }} />
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {!playing
              ? <Btn small variant="secondary" onClick={() => setPlaying(true)}>▶ Play</Btn>
              : <Btn small variant="secondary" onClick={() => setPlaying(false)}>✕ Close</Btn>
            }

            {!loadingNotes && (
              <>
                {isListening ? (
                  <Btn small onClick={stopListening} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }}>
                    ⏹ Stop & Save Notes
                  </Btn>
                ) : (
                  <Btn small onClick={startListening}>🎙 Take Notes</Btn>
                )}

                {notes && !isListening && (
                  <Btn small variant="secondary" onClick={() => setShowNotes(v => !v)}>
                    📝 {showNotes ? 'Hide Notes' : 'View Notes'}
                  </Btn>
                )}

                {notes && (
                  <Btn small variant="secondary" onClick={() => downloadNotesPDF(notes, lecture.title)}>
                    ⬇ PDF
                  </Btn>
                )}
              </>
            )}
          </div>

          {(isListening || notesStatus) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              {isListening && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
                  display: 'inline-block', animation: 'livePulse 1.2s ease-in-out infinite',
                }} />
              )}
              <p style={{ margin: 0, fontSize: 12, color: isListening ? '#ef4444' : 'var(--text-muted)' }}>
                {isListening ? 'Listening — play the lecture audio' : notesStatus}
              </p>
            </div>
          )}

          {showNotes && notes && (
            <NotesPanel notes={notes} title={lecture.title} onClose={() => setShowNotes(false)} />
          )}
        </div>
      </div>
    </div>
  )
}
