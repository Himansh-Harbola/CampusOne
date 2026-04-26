import { useEffect, useRef, useState } from 'react'
import { loadModels, detectDescriptor, matchDescriptor, startCamera, stopCamera } from '../lib/faceRecognition'
import { getFaceDescriptor } from '../lib/db'
import { useApp } from '../context/AppContext'

// onVerified() called when face matches
// onClose() called on cancel
export default function FaceVerify({ onVerified, onClose }) {
  const { user } = useApp()
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  const [phase, setPhase]     = useState('loading') // loading | scanning | matched | failed | not_enrolled
  const [attempts, setAttempts] = useState(0)
  const [statusMsg, setStatusMsg] = useState('Loading face recognition…')
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    init()
    return () => {
      clearInterval(intervalRef.current)
      stopCamera(streamRef.current)
    }
  }, [])

  async function init() {
    try {
      // 1. Check enrollment
      setStatusMsg('Checking face enrollment…')
      const saved = await getFaceDescriptor(user.id)
      if (!saved) {
        setPhase('not_enrolled')
        setStatusMsg('You have not enrolled your face yet.')
        return
      }

      // 2. Load models + camera
      setStatusMsg('Loading AI models…')
      await loadModels()
      setStatusMsg('Starting camera…')
      const stream = await startCamera(videoRef.current)
      streamRef.current = stream

      setPhase('scanning')
      setStatusMsg('Looking for your face…')

      // 3. Scan every 1.2 seconds
      intervalRef.current = setInterval(() => scanFace(saved), 1200)
    } catch (e) {
      console.error(e)
      setPhase('failed')
      setStatusMsg('Could not start camera. Check permissions.')
    }
  }

  async function scanFace(savedDescriptor) {
    if (!videoRef.current) return
    try {
      const live = await detectDescriptor(videoRef.current)
      if (!live) {
        setStatusMsg('No face detected — look directly at the camera')
        return
      }
      const match = matchDescriptor(live, savedDescriptor)
      setAttempts(a => a + 1)
      if (match) {
        clearInterval(intervalRef.current)
        setPhase('matched')
        setStatusMsg('Identity verified! Joining class…')
        stopCamera(streamRef.current)
        // Small delay so the user sees the success state
        let c = 3
        setCountdown(c)
        const t = setInterval(() => {
          c--
          setCountdown(c)
          if (c <= 0) { clearInterval(t); onVerified() }
        }, 1000)
      } else {
        setStatusMsg(`Face not matched — ensure good lighting (attempt ${attempts + 1})`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  function handleCancel() {
    clearInterval(intervalRef.current)
    stopCamera(streamRef.current)
    onClose()
  }

  const bgColor = phase === 'matched' ? '#eaf3de'
    : phase === 'failed' || phase === 'not_enrolled' ? '#fcebeb'
    : 'var(--bg-elevated)'

  const textColor = phase === 'matched' ? '#3b6d11'
    : phase === 'failed' || phase === 'not_enrolled' ? '#a32d2d'
    : 'var(--text-secondary)'

  const borderColor = phase === 'matched' ? '#3b6d11'
    : phase === 'scanning' ? 'var(--accent)'
    : 'var(--border-dim)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 22,
        padding: '28px', width: 380,
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-dim)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {phase === 'matched' ? '✅' : phase === 'not_enrolled' ? '⚠️' : phase === 'failed' ? '❌' : '🔍'}
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
            {phase === 'matched' ? 'Identity Verified' : phase === 'not_enrolled' ? 'Face Not Enrolled' : 'Face Verification'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            {phase === 'matched' ? `Joining in ${countdown}s…` : 'Verify your identity to join the live class'}
          </p>
        </div>

        {/* Camera view */}
        <div style={{
          width: '100%', aspectRatio: '4/3',
          background: '#0a0a0f', borderRadius: 14, overflow: 'hidden',
          marginBottom: 16, position: 'relative',
          border: `2px solid ${borderColor}`,
          transition: 'border-color 0.4s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              display: phase === 'scanning' ? 'block' : 'none',
              transform: 'scaleX(-1)',
            }}
          />
          {phase !== 'scanning' && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 40 }}>
                {phase === 'loading' ? '⏳' : phase === 'matched' ? '✅' : phase === 'not_enrolled' ? '⚠️' : '❌'}
              </div>
              {phase === 'loading' && (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '8px 0 0' }}>Initializing…</p>
              )}
            </div>
          )}

          {/* Scanning overlay: oval guide + pulse ring */}
          {phase === 'scanning' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: 140, height: 180, borderRadius: '50%',
                border: '3px solid var(--accent)',
                boxShadow: '0 0 0 4px rgba(201,125,46,0.2)',
                animation: 'facePulse 1.6s ease-in-out infinite',
              }} />
            </div>
          )}

          {/* Matched overlay */}
          {phase === 'matched' && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 12,
              background: 'rgba(59,109,17,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 56 }}>✅</span>
            </div>
          )}
        </div>

        {/* Status message */}
        <div style={{
          background: bgColor, color: textColor,
          fontSize: 12.5, padding: '8px 14px', borderRadius: 9,
          marginBottom: 16, textAlign: 'center', fontFamily: 'var(--font-body)',
          transition: 'background 0.3s, color 0.3s',
        }}>
          {statusMsg}
        </div>

        {/* Attempt count */}
        {phase === 'scanning' && attempts > 0 && (
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', margin: '0 0 12px', fontFamily: 'var(--font-body)' }}>
            {attempts} scan{attempts > 1 ? 's' : ''} attempted
          </p>
        )}

        {/* Not enrolled → go enroll */}
        {phase === 'not_enrolled' && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
            Go to your profile and enroll your face before joining a live class.
          </p>
        )}

        {/* Cancel button */}
        {phase !== 'matched' && (
          <button onClick={handleCancel} style={{
            width: '100%', padding: '10px', borderRadius: 10,
            border: '1px solid var(--border-subtle)',
            background: 'transparent', color: 'var(--text-secondary)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            Cancel
          </button>
        )}
      </div>

      <style>{`
        @keyframes facePulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(201,125,46,0.15); }
          50%       { box-shadow: 0 0 0 8px rgba(201,125,46,0.30); }
        }
      `}</style>
    </div>
  )
}
