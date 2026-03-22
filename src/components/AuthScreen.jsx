import { useState } from 'react';
import { useApp } from '../context/AppContext';

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: 14,
  marginBottom: 12,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
};

export default function AuthScreen() {
  const { login, signup, allUsers } = useApp();
  const [mode, setMode]   = useState('login');
  const [role, setRole]   = useState('student');
  const [error, setError] = useState('');
  const [form, setForm]   = useState({
    name: '', email: '', password: '', department: '', rollNo: '',
  });

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleLogin() {
    const u = allUsers.find(
      (u) => u.email === form.email && u.password === form.password,
    );
    if (!u) {
      setError('Invalid email or password.');
      return;
    }
    login(u);
  }

  function handleSignup() {
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (allUsers.find((u) => u.email === form.email)) {
      setError('An account with this email already exists.');
      return;
    }
    signup(form, role);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          padding: '44px 38px',
          width: 400,
          maxWidth: '100%',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: 26,
            }}
          >
            🎓
          </div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>
            CampusOne
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 13,
              margin: '4px 0 0',
            }}
          >
            College Management System
          </p>
        </div>

        {/* Mode tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: 4,
            marginBottom: 22,
            gap: 4,
          }}
        >
          {['login', 'signup'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 7,
                border: 'none',
                background: mode === m ? 'rgba(255,255,255,0.13)' : 'transparent',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.45)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Signup extras */}
        {mode === 'signup' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {['student', 'teacher'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 10,
                    border: `2px solid ${role === r ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                    background: role === r ? 'rgba(99,102,241,0.18)' : 'transparent',
                    color: role === r ? '#a5b4fc' : 'rgba(255,255,255,0.45)',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {r === 'student' ? '👨‍🎓 Student' : '👩‍🏫 Teacher'}
                </button>
              ))}
            </div>

            <input
              placeholder="Full Name *"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Department"
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
              style={inputStyle}
            />
            {role === 'student' && (
              <input
                placeholder="Roll Number"
                value={form.rollNo}
                onChange={(e) => set('rollNo', e.target.value)}
                style={inputStyle}
              />
            )}
          </>
        )}

        <input
          placeholder="Email address *"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Password *"
          type="password"
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
          style={{ ...inputStyle, marginBottom: 6 }}
        />

        {error && (
          <p
            style={{
              color: '#f87171',
              fontSize: 12,
              margin: '0 0 12px',
              lineHeight: 1.5,
            }}
          >
            {error}
          </p>
        )}

        <button
          onClick={mode === 'login' ? handleLogin : handleSignup}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 8,
            transition: 'opacity 0.15s',
          }}
        >
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        {mode === 'login' && (
          <div
            style={{
              marginTop: 18,
              padding: '12px 14px',
              background: 'rgba(99,102,241,0.08)',
              borderRadius: 10,
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <p
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                margin: 0,
                lineHeight: 1.8,
              }}
            >
              <strong style={{ color: '#a5b4fc' }}>Teacher:</strong>{' '}
              priya@campus.edu / teacher123
              <br />
              <strong style={{ color: '#34d399' }}>Student:</strong>{' '}
              rahul@campus.edu / student123
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
