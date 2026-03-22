import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Avatar from './ui/Avatar';
import { MOCK_USERS } from '../data/mockData';

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
    <aside
      style={{
        width: collapsed ? 68 : 240,
        background: '#13151f',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Logo header */}
      <div
        style={{
          padding: '18px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 64,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          🎓
        </div>
        {!collapsed && (
          <span
            style={{
              fontWeight: 700,
              fontSize: 17,
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            CampusOne
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer',
            fontSize: 14,
            padding: 4,
            flexShrink: 0,
            borderRadius: 6,
            lineHeight: 1,
          }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div style={{ padding: '10px 14px 6px' }}>
          <span
            style={{
              fontSize: 11,
              color: user.role === 'teacher' ? '#a5b4fc' : '#34d399',
              background:
                user.role === 'teacher'
                  ? 'rgba(99,102,241,0.12)'
                  : 'rgba(16,185,129,0.12)',
              padding: '3px 10px',
              borderRadius: 20,
              textTransform: 'capitalize',
              fontWeight: 500,
            }}
          >
            {user.role}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav style={{ padding: '8px', flex: 1 }}>
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
                padding: collapsed ? '10px 0' : '10px 12px',
                borderRadius: 10,
                border: 'none',
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: active ? '#a5b4fc' : 'rgba(255,255,255,0.45)',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                marginBottom: 2,
                textAlign: 'left',
                justifyContent: collapsed ? 'center' : 'flex-start',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && (
                <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
              )}
              {!collapsed && active && (
                <span
                  style={{
                    marginLeft: 'auto',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#6366f1',
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {!collapsed && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10,
              padding: '8px 10px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <Avatar initials={user.avatar} size={32} colorIndex={colorIndex} />
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#e2e8f0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.name}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                {user.department || user.rollNo || '—'}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? 'Sign out' : undefined}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.35)',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'color 0.15s',
          }}
        >
          <span>↩</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
