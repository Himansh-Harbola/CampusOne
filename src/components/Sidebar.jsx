import { useState } from 'react';
import { useApp, APP_NAME } from '../context/AppContext';
import Avatar from './ui/Avatar';

const NAV_ITEMS = [
  { id: 'dashboard',   icon: '⊞', label: 'Dashboard'   },
  { id: 'classes',     icon: '📚', label: 'My Classes'  },
  { id: 'quizzes',     icon: '📝', label: 'Quizzes'     },
  { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
  { id: 'attendance',  icon: '✅', label: 'Attendance'  },
  { id: 'chatroom',    icon: '💬', label: 'Chatroom'    },
];

export default function Sidebar() {
  const { user, activeTab, setActiveTab, logout, allUsers } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const colorIndex = allUsers.findIndex((u) => u.id === user.id);

  return (
    <aside style={{
      width: collapsed ? 64 : 234,
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '22px 0' : '22px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        minHeight: 72,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>🎓</div>
        {!collapsed && (
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            color: 'var(--text-sidebar)',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}>{APP_NAME}</span>
        )}
        <button onClick={() => setCollapsed(c => !c)} style={{
          marginLeft: collapsed ? 0 : 'auto',
          background: 'none', border: 'none',
          color: 'var(--text-sidebar-muted)',
          cursor: 'pointer', fontSize: 12, padding: 4,
          flexShrink: 0, borderRadius: 4, lineHeight: 1,
        }}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div style={{ padding: '12px 20px 4px' }}>
          <span style={{
            fontSize: 10,
            fontFamily: 'var(--font-body)',
            color: 'var(--accent)',
            background: 'rgba(201,125,46,0.15)',
            padding: '3px 10px', borderRadius: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 600,
          }}>
            {user.role}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav style={{ padding: '10px 10px', flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: collapsed ? '11px 0' : '10px 14px',
                borderRadius: 9,
                border: 'none',
                borderLeft: active && !collapsed ? '3px solid var(--accent)' : '3px solid transparent',
                background: active ? 'rgba(201,125,46,0.12)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-sidebar-muted)',
                fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                marginBottom: 3,
                textAlign: 'left',
                justifyContent: collapsed ? 'center' : 'flex-start',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', marginBottom: 8,
            borderRadius: 9,
            background: 'rgba(255,255,255,0.04)',
          }}>
            <Avatar initials={user.avatar} size={30} colorIndex={colorIndex} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text-sidebar)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </p>
              <p style={{ margin: 0, fontSize: 10.5, color: 'var(--text-sidebar-muted)' }}>
                {user.department || user.rollNo || '—'}
              </p>
            </div>
          </div>
        )}
        <button onClick={logout} title={collapsed ? 'Sign out' : undefined} style={{
          width: '100%', padding: '8px',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
          background: 'transparent', color: 'var(--text-sidebar-muted)',
          fontSize: 12.5, cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6,
          fontFamily: 'var(--font-body)',
          transition: 'color 0.15s',
        }}>
          <span>↩</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
