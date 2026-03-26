import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { endLiveSession } from '../lib/db'

export default function LiveClass({ session, cls, onClose, isTeacher }) {
  const { user } = useApp()
  const jitsiContainer = useRef(null)
  const apiRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [ending, setEnding] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [jitsiLoaded, setJitsiLoaded] = useState(false)

  useEffect(() => {
    // Load Jitsi external API script
    if (window.JitsiMeetExternalAPI) {
      initJitsi()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.onload = () => initJitsi()
    document.head.appendChild(script)

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
      }
    }
  }, [])

  function initJitsi() {
    if (!jitsiContainer.current) return

    const domain = 'meet.jit.si'
    const options = {
      roomName: session.room_name,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer.current,
      userInfo: {
        displayName: user.name,
        email: user.email || '',
      },
      configOverwrite: {
        startWithAudioMuted: !isTeacher,
        startWithVideoMuted: !isTeacher,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
        enableClosePage: false,
        // Teacher is moderator (joins first, sets up lobby)
        ...(isTeacher && {
          enableLobbyChat: true,
          hideLobbyButton: false,
        }),
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
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        HIDE_INVITE_MORE_HEADER: true,
        MOBILE_APP_PROMO: false,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
      },
    }

    const api = new window.JitsiMeetExternalAPI(domain, options)
    apiRef.current = api
    setJitsiLoaded(true)

    // Event listeners
    api.addEventListener('videoConferenceJoined', () => {
      setParticipantCount(api.getNumberOfParticipants())
      if (isTeacher) {
        // Enable lobby so students wait for teacher to admit
        // api.executeCommand('toggleLobby', true) // uncomment if you want waiting room
      }
    })

    api.addEventListener('participantJoined', () => {
      setParticipantCount(api.getNumberOfParticipants())
    })

    api.addEventListener('participantLeft', () => {
      setParticipantCount(api.getNumberOfParticipants())
    })

    api.addEventListener('audioMuteStatusChanged', ({ muted }) => {
      setIsMuted(muted)
    })

    api.addEventListener('videoMuteStatusChanged', ({ muted }) => {
      setIsVideoOff(muted)
    })

    api.addEventListener('readyToClose', () => {
      if (isTeacher) handleEndLive()
      else onClose()
    })
  }

  async function handleEndLive() {
    if (!isTeacher) { onClose(); return }
    setEnding(true)
    try {
      await endLiveSession(session.id)
    } catch (e) { console.error(e) }
    finally {
      if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null }
      setEnding(false)
      onClose()
    }
  }

  function toggleFullscreen() {
    setIsFullscreen(f => !f)
  }

  const wrapperStyle = isFullscreen
    ? { position: 'fixed', inset: 0, zIndex: 1000, background: '#000', display: 'flex', flexDirection: 'column' }
    : { position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }

  return (
    <div style={wrapperStyle}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', flexShrink: 0,
        background: isFullscreen ? '#0a0a0f' : 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-dim)',
      }}>
        {/* Left: class info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
            color: '#ef4444', fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#ef4444',
              display: 'inline-block', animation: 'livePulse 1.4s ease-in-out infinite',
            }} />
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

        {/* Right: controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            style={iconBtnStyle}
          >
            {isFullscreen ? '⊡' : '⛶'}
          </button>

          {/* End / Leave */}
          {isTeacher ? (
            <button
              onClick={handleEndLive}
              disabled={ending}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: ending ? 'rgba(239,68,68,0.4)' : '#ef4444',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: ending ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {ending ? 'Ending…' : '⏹ End Live'}
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                padding: '6px 14px', borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              ← Leave
            </button>
          )}
        </div>
      </div>

      {/* Jitsi iframe container */}
      <div
        ref={jitsiContainer}
        style={{ flex: 1, minHeight: 0, background: '#000', position: 'relative' }}
      >
        {!jitsiLoaded && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#0a0a0f', gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(239,68,68,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26,
            }}>📡</div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
              Connecting to live class…
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#ef4444', opacity: 0.7,
                  animation: `livePulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  display: 'inline-block',
                }} />
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
