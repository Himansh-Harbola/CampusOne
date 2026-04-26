import { useEffect, useRef, useState } from 'react'
import { loadModels, detectDescriptor, startCamera, stopCamera } from '../lib/faceRecognition'
import { saveFaceDescriptor, getFaceDescriptor } from '../lib/db'
import { useApp } from '../context/AppContext'

// Status levels for coloured feedback pill
const STATUS = {
  idle:       { color: 'var(--text-muted)',    bg: 'var(--bg-elevated)',         text: 'Camera not started' },
  loading:    { color: '#185fa5',              bg: '#e6f1fb',                    text: 'Loading AI models…' },
  camera:     { color: '#185fa5',              bg: '#e6f1fb',                    text: 'Starting camera…' },
  ready:      { color: 'var(--text-primary)',   bg: 'var(--bg-elevated)',         text: 'Look directly at the camera' },
  capturing:  { color: '#854f0b',              bg: '#faeeda',                    text: 'Capturing face…' },
  noface:     { color: '#a32d2d',              bg: '#fcebeb',                    text: 'No face detected — adjust lighting or position' },
  multiface:  { color: '#a32d2d',              bg: '#fcebeb',                    text: 'Multiple faces detected — only you should be visible' },
  saved:      { color: '#3b6d11',              bg: '#eaf3de',                    text: 'Face enrolled successfully ✓' },
  error:      { color: '#a32d2d',              bg: '#fcebeb',                    text: 'Error — try again' },
}

export default function FaceEnroll({ onClose }) {
  const { user } = useApp()
  const videoRef  = useRef(null)
  const streamRef = useRef(null)

  const [phase, setPhase]         = useState('idle')   // idle | loading | ready | capturing | saved | error
  const [statusKey, setStatusKey] = useState('idle')
  const [alreadyHas, setAlreadyHas] = useState(false)
  const [saving, setSaving]       = useState(false)

  // Check if student already enrolled
  useEffect(() => {
    getFaceDescriptor(user.id).then(d => setAlreadyHas(!!d)).catch(() => {})
  }, [user.id])

  async function handleStart() {
    setStatusKey('loading')
    setPhase('loading')
    try {
      await loadModels()
      setStatusKey('camera')
      await startCamera(videoRef.current)
      streamRef.current = videoRef.current.srcObject
      setPhase('ready')
      setStatusKey('ready')
    } catch (e) {
      console.error(e)
      setStatusKey('error')
      setPhase('error')
    }
  }

  async function handleCapture() {
    setStatusKey('capturing')
    setPhase('capturing')
    setSaving(true)
    try {
      const descriptor = await detectDescriptor(videoRef.current)
      if (!descriptor) {
        setStatusKey('noface')
        setPhase('ready')
        setSaving(false)
        return
      }
      await saveFaceDescriptor(user.id, descriptor)
      setAlreadyHas(true)
      setPhase('saved')
      setStatusKey('saved')
      // Stop camera after successful enroll
      stopCamera(streamRef.current)
    } catch (e) {
      console.error(e)
      setStatusKey('error')
      setPhase('ready')
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    stopCamera(streamRef.current)
    onClose?.()
  }

  const status = STATUS[statusKey]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 20,
        padding: '28px 28px 24px', width: 380,
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-dim)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
              {alreadyHas ? '🔄 Re-enroll Face' : '📸 Enroll Your Face'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Required for face-verified class attendance
            </p>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Already enrolled badge */}
        {alreadyHas && phase !== 'saved' && (
          <div style={{ background: '#eaf3de', color: '#3b6d11', fontSize: 12, padding: '6px 12px', borderRadius: 8, marginBottom: 16, fontFamily: 'var(--font-body)' }}>
            ✓ You already have a face enrolled. Capturing again will replace it.
          </div>
        )}

        {/* Camera box */}
        <div style={{
          width: '100%', aspectRatio: '4/3', background: '#0a0a0f',
          borderRadius: 14, overflow: 'hidden', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', border: '2px solid var(--border-dim)',
        }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              display: phase === 'ready' || phase === 'capturing' ? 'block' : 'none',
              transform: 'scaleX(-1)', // mirror
            }}
          />
          {(phase === 'idle' || phase === 'error') && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
              <p style={{ fontSize: 12, margin: 0 }}>Camera will appear here</p>
            </div>
          )}
          {(phase === 'loading' || phase === 'camera') && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontSize: 13 }}>Loading…</div>
            </div>
          )}
          {phase === 'saved' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48 }}>✅</div>
              <p style={{ fontSize: 13, color: '#fff', margin: '8px 0 0' }}>Face enrolled!</p>
            </div>
          )}

          {/* Face guide oval overlay */}
          {(phase === 'ready' || phase === 'capturing') && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: 140, height: 180,
                border: `3px solid ${saving ? '#c97d2e' : 'rgba(255,255,255,0.5)'}`,
                borderRadius: '50%',
                boxShadow: saving ? '0 0 0 2px rgba(201,125,46,0.3)' : 'none',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }} />
            </div>
          )}
        </div>

        {/* Status pill */}
        <div style={{
          background: status.bg, color: status.color,
          fontSize: 12, padding: '6px 12px', borderRadius: 8,
          marginBottom: 16, fontFamily: 'var(--font-body)',
          textAlign: 'center',
        }}>
          {status.text}
        </div>

        {/* Instructions */}
        {phase === 'ready' && (
          <ul style={{ margin: '0 0 16px', paddingLeft: 18, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8, fontFamily: 'var(--font-body)' }}>
            <li>Face the camera directly in good lighting</li>
            <li>Make sure only your face is visible</li>
            <li>Remove glasses or hats if possible</li>
          </ul>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {phase === 'idle' || phase === 'error' ? (
            <button onClick={handleStart} style={primaryBtn}>
              Start Camera
            </button>
          ) : phase === 'ready' ? (
            <button onClick={handleCapture} disabled={saving} style={primaryBtn}>
              {saving ? 'Capturing…' : 'Capture & Enroll'}
            </button>
          ) : phase === 'saved' ? (
            <button onClick={handleClose} style={primaryBtn}>
              Done
            </button>
          ) : null}
          {phase !== 'saved' && (
            <button onClick={handleClose} style={secondaryBtn}>Cancel</button>
          )}
        </div>
      </div>
    </div>
  )
}

const primaryBtn = {
  flex: 1, padding: '10px', borderRadius: 10, border: 'none',
  background: 'var(--accent)', color: '#fff',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const secondaryBtn = {
  padding: '10px 16px', borderRadius: 10,
  border: '1px solid var(--border-subtle)',
  background: 'transparent', color: 'var(--text-secondary)',
  fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
}
