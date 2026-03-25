import { useApp } from './context/AppContext'
import AuthScreen from './components/AuthScreen'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Classes from './pages/Classes'
import Quizzes from './pages/Quizzes'
import Leaderboard from './pages/Leaderboard'
import Attendance from './pages/Attendance'
import Timetable from './pages/Timetable'
import ChatRoom from './pages/ChatRoom'

const PAGES = {
  dashboard:   <Dashboard />,
  classes:     <Classes />,
  quizzes:     <Quizzes />,
  leaderboard: <Leaderboard />,
  attendance:  <Attendance />,
  timetable:   <Timetable />,
  chatroom:    <ChatRoom />,
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 13, background: '#c97d2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🎓</div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-primary)' }}>CampusOne</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Loading…</p>
    </div>
  )
}

export default function App() {
  const { user, loading, activeTab } = useApp()

  if (loading) return <LoadingScreen />
  if (!user)   return <AuthScreen />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Topbar />
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0, background: 'var(--bg-base)' }}>
        {PAGES[activeTab] ?? <Dashboard />}
      </main>
    </div>
  )
}
