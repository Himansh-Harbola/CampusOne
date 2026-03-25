import { useState, useEffect } from 'react'
import { useApp, APP_NAME, APP_TAGLINE } from '../context/AppContext'
import { signIn, signUp } from '../lib/auth'

export default function AuthScreen() {
  const { theme, toggleTheme, user } = useApp()

  // When user becomes available (auth succeeded), stop spinner
  useEffect(() => {
    if (user) setLoading(false)
  }, [user])
  const [showAuth, setShowAuth] = useState(false)
  const [mode, setMode]         = useState('login')
  const [role, setRole]         = useState('student')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [form, setForm]         = useState({
    name: '', email: '', password: '', department: '', rollNo: '',
  })
  const isDark = theme === 'dark'

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleLogin() {
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    try {
      await signIn({ email: form.email, password: form.password })
      // AppContext onAuthStateChange will set user → useEffect above clears loading
    } catch (e) {
      setError(e.message || 'Invalid email or password.')
      setLoading(false) // only reset on error
    }
  }

  async function handleSignup() {
    if (!form.name || !form.email || !form.password) { setError('Please fill in all required fields.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    try {
      await signUp({
        email:      form.email,
        password:   form.password,
        name:       form.name,
        role,
        department: form.department,
        rollNo:     form.rollNo,
      })
      // AppContext onAuthStateChange will set user → useEffect above clears loading
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
      setLoading(false) // only reset on error
    }
  }

  const features = [
    { icon: '🎬', title: 'Video Lectures',      desc: 'Upload and stream lectures directly. Students access anytime, at their own pace.' },
    { icon: '🤖', title: 'AI Attendance',        desc: 'Face recognition powered check-ins. No proxies, no paper registers.' },
    { icon: '📝', title: 'Smart Tests',          desc: 'Create MCQ tests, auto-grade submissions, track performance over time.' },
    { icon: '💬', title: 'Discussion Forum',     desc: 'Per-class doubt-clearing rooms. Teachers and students, connected.' },
    { icon: '🏆', title: 'Department Rankings',  desc: 'Gamified learning with points and rankings. Motivate students to stay ahead.' },
    { icon: '📅', title: 'Timetable',            desc: 'Weekly schedules at a glance. Never miss a class or a deadline.' },
  ]

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`,
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    color: isDark ? '#e8eaf6' : '#1c1410',
    fontSize: 14, marginBottom: 12, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'var(--font-body)',
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', minHeight: '100vh', background: isDark ? '#0d0e1a' : '#faf7f2' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        background: isDark ? 'rgba(13,14,26,0.92)' : 'rgba(250,247,242,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#c97d2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎓</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: isDark ? '#e8eaf6' : '#1c1410' }}>{APP_NAME}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => { setShowAuth(true); setMode('login') }} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`, background: 'transparent', color: isDark ? '#e8eaf6' : '#1c1410', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Sign In
          </button>
          <button onClick={() => { setShowAuth(true); setMode('signup') }} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#c97d2e', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '80px 48px 60px',
        background: isDark
          ? 'linear-gradient(135deg, #0d0e1a 0%, #13152a 50%, #1e1b3a 100%)'
          : 'linear-gradient(135deg, #faf7f2 0%, #f0ebe0 50%, #e8dfd0 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid bg */}
        <div style={{ position: 'absolute', inset: 0, opacity: isDark ? 0.04 : 0.06, backgroundImage: `linear-gradient(${isDark ? '#fff' : '#1c1410'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? '#fff' : '#1c1410'} 1px, transparent 1px)`, backgroundSize: '48px 48px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          {/* Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(201,125,46,0.12)', border: '1px solid rgba(201,125,46,0.25)', marginBottom: 24 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c97d2e', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: '#c97d2e', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>College Management Platform</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1.1, color: isDark ? '#e8eaf6' : '#1c1410', marginBottom: 20, letterSpacing: '-0.5px' }}>
              {APP_TAGLINE}
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.7, color: isDark ? '#9196c4' : '#5c4a36', marginBottom: 36, maxWidth: 480, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              CampusOne brings together teachers, students, and administrators into a single seamless platform — from live attendance to AI-graded tests.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => { setShowAuth(true); setMode('signup') }} style={{ padding: '13px 32px', borderRadius: 10, border: 'none', background: '#c97d2e', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 4px 20px rgba(201,125,46,0.35)' }}>
                Get Started Free →
              </button>
              <button onClick={() => { setShowAuth(true); setMode('login') }} style={{ padding: '13px 32px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`, background: 'transparent', color: isDark ? '#e8eaf6' : '#1c1410', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Sign In
              </button>
            </div>
            <div style={{ display: 'flex', gap: 32, marginTop: 44 }}>
              {[['500+','Students'],['50+','Teachers'],['99%','Uptime']].map(([num, label]) => (
                <div key={label}>
                  <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 28, color: isDark ? '#e8eaf6' : '#1c1410', lineHeight: 1 }}>{num}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: isDark ? '#9196c4' : '#a08060', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: SVG illustration */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg viewBox="0 0 480 480" width="100%" style={{ maxWidth: 460, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))' }}>
              <rect x="60" y="240" width="360" height="180" rx="4" fill={isDark ? '#1e1b3a' : '#fff'} stroke={isDark ? '#2a2d54' : '#ede8df'} strokeWidth="1.5"/>
              {[100,160,220,280,340].map(x => <rect key={x} x={x} y="200" width="18" height="220" rx="3" fill={isDark ? '#2a2d54' : '#f0ebe0'} stroke={isDark ? '#3a3d64' : '#d9d0c3'} strokeWidth="1"/>)}
              <polygon points="40,200 240,100 440,200" fill={isDark ? '#13152a' : '#faf7f2'} stroke={isDark ? '#2a2d54' : '#ede8df'} strokeWidth="1.5"/>
              <rect x="200" y="330" width="80" height="90" rx="40 40 0 0" fill={isDark ? '#0a0b16' : '#e8dfd0'} stroke={isDark ? '#3a3d64' : '#d9d0c3'} strokeWidth="1.5"/>
              {[[100,270],[160,270],[280,270],[340,270],[100,330],[160,330],[280,330],[340,330]].map(([x,y],i) => <rect key={i} x={x} y={y} width="42" height="38" rx="4" fill={isDark ? '#1a2040' : '#e6f1fb'} stroke={isDark ? '#3a3d64' : '#b5d4f4'} strokeWidth="1"/>)}
              <line x1="240" y1="100" x2="240" y2="40" stroke="#c97d2e" strokeWidth="2"/>
              <rect x="240" y="40" width="36" height="22" rx="2" fill="#c97d2e"/>
              <rect x="140" y="418" width="200" height="12" rx="2" fill={isDark ? '#2a2d54' : '#ede8df'}/>
              <rect x="120" y="430" width="240" height="10" rx="2" fill={isDark ? '#1e2040' : '#e0d8cc'}/>
              <rect x="360" y="140" width="28" height="36" rx="3" fill="#c97d2e" opacity="0.85" transform="rotate(-8,374,158)"/>
              <rect x="368" y="140" width="28" height="36" rx="3" fill={isDark ? '#9196c4' : '#85b7eb'} opacity="0.7" transform="rotate(4,382,158)"/>
              {[[80,140],[400,170],[430,280],[50,310]].map(([x,y],i) => (
                <g key={i} transform={`translate(${x},${y})`}>
                  <line x1="0" y1="-7" x2="0" y2="7" stroke="#c97d2e" strokeWidth="1.5" opacity="0.5"/>
                  <line x1="-7" y1="0" x2="7" y2="0" stroke="#c97d2e" strokeWidth="1.5" opacity="0.5"/>
                </g>
              ))}
              <g transform="translate(390,80)">
                <polygon points="0,-14 16,4 0,10 -16,4" fill={isDark ? '#e8eaf6' : '#1c1410'} opacity="0.6"/>
                <rect x="-6" y="4" width="12" height="10" rx="2" fill={isDark ? '#9196c4' : '#5c4a36'} opacity="0.4"/>
                <line x1="16" y1="4" x2="22" y2="14" stroke="#c97d2e" strokeWidth="1.5" opacity="0.7"/>
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 48px', background: isDark ? '#13152a' : '#ffffff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#c97d2e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Everything you need</p>
          <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 42, color: isDark ? '#e8eaf6' : '#1c1410', marginBottom: 12 }}>Built for modern campuses</h2>
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, color: isDark ? '#9196c4' : '#5c4a36', marginBottom: 56, maxWidth: 520, margin: '0 auto 56px' }}>
            From the first lecture to the final exam — everything your institution needs in one place.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {features.map(f => (
              <div key={f.title} style={{ padding: '28px 26px', background: isDark ? '#1e1b3a' : '#faf7f2', borderRadius: 16, border: `1px solid ${isDark ? '#2a2d54' : '#ede8df'}` }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: isDark ? '#e8eaf6' : '#1c1410', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: isDark ? '#9196c4' : '#5c4a36', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '32px 48px', borderTop: `1px solid ${isDark ? '#1e2040' : '#ede8df'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? '#0d0e1a' : '#faf7f2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: isDark ? '#e8eaf6' : '#1c1410' }}>{APP_NAME}</span>
          <span style={{ fontSize: 12, color: isDark ? '#565a8a' : '#a08060' }}>· College Management Platform</span>
        </div>
        <p style={{ fontSize: 12, color: isDark ? '#565a8a' : '#a08060' }}>© 2026 {APP_NAME}. All rights reserved.</p>
      </footer>

      {/* AUTH MODAL */}
      {showAuth && (
        <div onClick={e => e.target === e.currentTarget && setShowAuth(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(6px)', padding: 16 }}>
          <div style={{ background: isDark ? '#13152a' : '#ffffff', border: `1px solid ${isDark ? '#1e2040' : '#ede8df'}`, borderRadius: 22, padding: '36px', width: 400, maxWidth: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 13, background: '#c97d2e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 24 }}>🎓</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: isDark ? '#e8eaf6' : '#1c1410', margin: 0 }}>{APP_NAME}</h2>
              <p style={{ fontSize: 13, color: isDark ? '#565a8a' : '#a08060', margin: '4px 0 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: isDark ? 'rgba(255,255,255,0.05)' : '#f5f0e8', borderRadius: 10, padding: 4, marginBottom: 20, gap: 4 }}>
              {['login','signup'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError('') }} style={{ flex: 1, padding: '8px', borderRadius: 7, border: 'none', background: mode === m ? (isDark ? '#1e1b3a' : '#fff') : 'transparent', color: mode === m ? (isDark ? '#e8eaf6' : '#1c1410') : (isDark ? '#565a8a' : '#a08060'), fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {mode === 'signup' && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {['student','teacher'].map(r => (
                    <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: `2px solid ${role === r ? '#c97d2e' : (isDark ? 'rgba(255,255,255,0.1)' : '#ede8df')}`, background: role === r ? 'rgba(201,125,46,0.1)' : 'transparent', color: role === r ? '#c97d2e' : (isDark ? '#565a8a' : '#a08060'), fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      {r === 'student' ? '👨‍🎓 Student' : '👩‍🏫 Teacher'}
                    </button>
                  ))}
                </div>
                <input placeholder="Full Name *" value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} />
                <input placeholder="Department" value={form.department} onChange={e => set('department', e.target.value)} style={inputStyle} />
                {role === 'student' && <input placeholder="Roll Number" value={form.rollNo} onChange={e => set('rollNo', e.target.value)} style={inputStyle} />}
              </>
            )}

            <input placeholder="Email address *" type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} />
            <input placeholder="Password * (min 6 chars)" type="password" value={form.password} onChange={e => set('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
              style={{ ...inputStyle, marginBottom: 6 }} />

            {error && <p style={{ color: isDark ? '#f87171' : '#a32d2d', fontSize: 12, margin: '0 0 12px', lineHeight: 1.5 }}>{error}</p>}

            <button
              onClick={mode === 'login' ? handleLogin : handleSignup}
              disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: loading ? '#a08060' : '#c97d2e', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, fontFamily: 'var(--font-body)', boxShadow: '0 4px 16px rgba(201,125,46,0.3)' }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
