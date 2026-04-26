import { useState } from 'react';
import { useApp, APP_NAME } from '../context/AppContext';
import Avatar from './ui/Avatar';
import FaceEnroll from './FaceEnroll';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Overview'            },
  { id: 'classes',     label: 'My Classes'           },
  { id: 'quizzes',     label: 'Tests'                },
  { id: 'leaderboard', label: 'Department Rankings'  },
  { id: 'timetable',   label: 'Timetable'            },
  { id: 'chatroom',    label: 'Discussion Forum'     },
];

export default function Topbar() {
  const { user, activeTab, setActiveTab, logout, theme, toggleTheme } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const isDark = theme === 'dark';
  const colorIndex = 0;

  return (
    <header style={{
      background: isDark ? '#0a0b16' : '#2c1f14',
      borderBottom: `1px solid ${isDark ? '#1e2040' : '#3d2a1a'}`,
      display: 'flex', alignItems: 'center',
      padding: '0 24px', height: 56, flexShrink: 0, gap: 0,
      position: 'relative', zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 32, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎓</div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fdf6ec', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{APP_NAME}</span>
      </div>

      {/* Role badge */}
      <span style={{ fontSize: 10, color: 'var(--accent)', background: 'rgba(201,125,46,0.18)', padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginRight: 24, flexShrink: 0 }}>
        {user.role}
      </span>

      {/* Nav items */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflow: 'hidden' }}>
        {NAV_ITEMS.map(item => {
          const active = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
              padding: '6px 13px', borderRadius: 7, border: 'none',
              background: active ? 'rgba(201,125,46,0.18)' : 'transparent',
              color: active ? '#e8a558' : 'rgba(253,246,236,0.45)',
              fontSize: 13, fontWeight: active ? 600 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: 'var(--font-body)',
              borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 16 }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'} style={{
          width: 34, height: 34, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)',
          fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fdf6ec',
        }}>
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* User dropdown */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(m => !m)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 10px 5px 5px', borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            cursor: 'pointer',
          }}>
            <Avatar initials={user.avatar} size={26} colorIndex={colorIndex} />
            <span style={{ fontSize: 12.5, color: '#fdf6ec', fontWeight: 500, fontFamily: 'var(--font-body)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name.split(' ')[0]}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(253,246,236,0.4)' }}>▼</span>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, minWidth: 180,
              background: isDark ? '#13152a' : '#2c1f14',
              border: `1px solid ${isDark ? '#1e2040' : '#3d2a1a'}`,
              borderRadius: 10, boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden', zIndex: 100,
            }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${isDark ? '#1e2040' : '#3d2a1a'}` }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fdf6ec' }}>{user.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(253,246,236,0.4)' }}>{user.email || user.department || '—'}</p>
              </div>
              {user.role === 'student' && (
                <button onClick={() => { setShowEnroll(true); setMenuOpen(false); }} style={{
                  width: '100%', padding: '10px 14px', border: 'none',
                  borderBottom: `1px solid ${isDark ? '#1e2040' : '#3d2a1a'}`,
                  background: 'transparent', color: 'rgba(253,246,236,0.6)',
                  fontSize: 13, cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  📸 Enroll Face
                </button>
              )}
              <button onClick={() => { logout(); setMenuOpen(false); }} style={{
                width: '100%', padding: '10px 14px', border: 'none',
                background: 'transparent', color: 'rgba(253,246,236,0.6)',
                fontSize: 13, cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ↩ Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Face enroll modal */}
      {showEnroll && <FaceEnroll onClose={() => setShowEnroll(false)} />}
    </header>
  );
}
