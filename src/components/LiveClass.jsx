import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { endLiveSession } from '../lib/db'
import { startTranscription, generateNotes } from '../lib/ai'
import { saveNotes } from '../lib/notes'

export default function LiveClass({ session, cls, onClose, isTeacher }) {
  const { user } = useApp()
  const jitsiContainer  = useRef(null)
  const apiRef          = useRef(null)
  const recognizerRef   = useRef(null)
  const transcriptRef   = useRef('')
  const notesRef        = useRef(null)
  const chunkTimerRef   = useRef(null)

  const [isFullscreen, setIsFullscreen]     = useState(false)
  const [ending, setEnding]                 = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [jitsiLoaded, setJitsiLoaded]       = useState(false)
  const [notesActive, setNotesActive]       = useState(false)
  const [notesStatus, setNotesStatus]       = useState('')     // small status pill

  // ── Start transcription ──────────────────────────────────
  function startTakingNotes() {
    transcriptRef.current = ''
    setNotesActive(true)
    setNotesStatus('Listening…')

    const controller = startTranscription({
      onTranscript: (text, isFinal) => {
        if (isFinal) transcriptRef.current += ' ' + text
      },
      onError: (err) => {
        setNotesStatus(err.message)
        setNotesActive(false)
      },
    })
    recognizerRef.current = controller

    // Process a chunk every 3 minutes silently
    chunkTimerRef.current = setInterval(processSilentChunk, 3 * 60 * 1000)
  }

  function stopTakingNotes() {
    recognizerRef.current?.stop()
    recognizerRef.current = null
    clearInterval(chunkTimerRef.current)
    setNotesActive(false)
    setNotesStatus('Notes paused')
    setTimeout(() => setNotesStatus(''), 2000)
  }

  async function processSilentChunk() {
    const chunk = transcriptRef.current.trim()
    if (!chunk) return
    transcriptRef.current = ''
    try {
      const updated = await generateNotes({
        transcript: chunk,
        existingNotes: notesRef.current,
        sessionTitle: session.title,
      })
      notesRef.current = updated
      await saveNotes({ sessionId: session.id, userId: user.id, transcript: chunk, notes: updated })
      setNotesStatus('Notes updated ✓')
      setTimeout(() => setNotesStatus(''), 2000)
    } catch (e) {
      console.error('Notes error:', e)
    }
  }

  async function finaliseNotes() {
    // Process any remaining transcript when class ends
    const chunk = transcriptRef.current.trim()
    if (!chunk && !notesRef.current) return
    try {
      if (chunk) {
        const updated = await generateNotes({
          transcript: chunk,
          existingNotes: notesRef.current,
          sessionTitle: session.title,
        })
        notesRef.current = updated
      }
      if (notesRef.current) {
        await saveNotes({ sessionId: session.id, userId: user.id, transcript: '', notes: notesRef.current })
      }
    } catch (e) { console.error('Final notes error:', e) }
  }

  // ── Jitsi ────────────────────────────────────────────────
  useEffect(() => {
    if (window.JitsiMeetExternalAPI) { initJitsi(); return }
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.onload = () => initJitsi()
    document.head.appendChild(script)

    return () => {
      recognizerRef.current?.stop()
      clearInterval(chunkTimerRef.current)
      if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null }
    }
  }, [])

  function initJitsi() {
    if (!jitsiContainer.current) return
    const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
      roomName: session.room_name,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer.current,
      userInfo: { displayName: user.name, email: user.email || '' },
      configOverwrite: {
        startWithAudioMuted: !isTeacher,
        startWithVideoMuted: !isTeacher,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
        enableClosePage: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'chat', 'raisehand',
          'videoquality', 'tileview', 'select-background',
          ...(isTeacher ? ['mute-everyone', 'security', 'participants-pane'] : []),
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        HIDE_INVITE_MORE_HEADER: true,
        MOBILE_APP_PROMO: false,
      },
    })
    apiRef.current = api
    setJitsiLoaded(true)

    api.addEventListener('videoConferenceJoined', () => setParticipantCount(api.getNumberOfParticipants()))
    api.addEventListener('participantJoined',     () => setParticipantCount(api.getNumberOfParticipants()))
    api.addEventListener('participantLeft',       () => setParticipantCount(api.getNumberOfParticipants()))
    api.addEventListener('readyToClose', () => {
      if (isTeacher) handleEndLive()
      else handleLeave()
    })
  }

  async function handleEndLive() {
    if (!isTeacher) { handleLeave(); return }
    setEnding(true)
    stopTakingNotes()
    await finaliseNotes()
    try { await endLiveSession(session.id) } catch (e) { console.error(e) }
    finally {
      if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null }
      setEnding(false)
      onClose()
    }
  }

  async function handleLeave() {
    stopTakingNotes()
    await finaliseNotes()
    onClose()
  }

  const wrapperStyle = isFullscreen
    ? { position: 'fixed', inset: 0, zIndex: 1000, background: '#000', display: 'flex', flexDirection: 'column' }
    : { position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }

  return (
    <div style={wrapperStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', flexShrink: 0,
        background: isFullscreen ? '#0a0a0f' : 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-dim)',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
            color: '#ef4444', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'livePulse 1.4s ease-in-out infinite' }} />
            LIVE
          </span>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {session.title}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
              {cls.name} · {cls.code}
              {jitsiLoaded && participantCount > 0 && ` · ${participantCount} participant${participantCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Notes status pill */}
          {notesStatus && (
            <span style={{ fontSize: 11, color: notesActive ? '#ef4444' : 'var(--text-muted)', padding: '3px 8px', borderRadius: 20, background: notesActive ? 'rgba(239,68,68,0.08)' : 'var(--bg-elevated)', border: '1px solid var(--border-dim)' }}>
              {notesActive && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#ef4444', marginRight: 5, animation: 'livePulse 1.2s ease-in-out infinite' }} />}
              {notesStatus}
            </span>
          )}

          {/* Take Notes toggle */}
          <button
            onClick={notesActive ? stopTakingNotes : startTakingNotes}
            title={notesActive ? 'Stop taking notes' : 'Start taking notes'}
            style={{
              ...iconBtnStyle,
              background: notesActive ? 'rgba(201,125,46,0.12)' : 'transparent',
              color: notesActive ? 'var(--accent)' : 'var(--text-muted)',
              border: `1px solid ${notesActive ? 'var(--accent)' : 'var(--border-subtle)'}`,
              fontSize: 14,
              padding: '0 10px',
              width: 'auto',
              gap: 5,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            🎙 {notesActive ? 'Notes On' : 'Take Notes'}
          </button>

          {/* Fullscreen */}
          <button onClick={() => setIsFullscreen(f => !f)} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} style={iconBtnStyle}>
            {isFullscreen ? '⊡' : '⛶'}
          </button>

          {/* End / Leave */}
          {isTeacher ? (
            <button onClick={handleEndLive} disabled={ending} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: ending ? 'rgba(239,68,68,0.4)' : '#ef4444',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: ending ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
            }}>
              {ending ? 'Ending…' : '⏹ End Live'}
            </button>
          ) : (
            <button onClick={handleLeave} style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)',
              background: 'transparent', color: 'var(--text-secondary)',
              fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>
              ← Leave
            </button>
          )}
        </div>
      </div>

      {/* Jitsi */}
      <div ref={jitsiContainer} style={{ flex: 1, minHeight: 0, background: '#000', position: 'relative' }}>
        {!jitsiLoaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>📡</div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Connecting to live class…</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', opacity: 0.7, animation: `livePulse 1.2s ease-in-out ${i * 0.2}s infinite`, display: 'inline-block' }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const iconBtnStyle = {
  width: 32, height: 32, borderRadius: 8,
  border: '1px solid var(--border-subtle)',
  background: 'transparent', color: 'var(--text-muted)',
  fontSize: 16, cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--font-body)',
}
