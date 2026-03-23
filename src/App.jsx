import { useApp } from './context/AppContext';
import AuthScreen from './components/AuthScreen';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Quizzes from './pages/Quizzes';
import Leaderboard from './pages/Leaderboard';
import Attendance from './pages/Attendance';
import Timetable from './pages/Timetable';
import ChatRoom from './pages/ChatRoom';

const PAGES = {
  dashboard:   <Dashboard />,
  classes:     <Classes />,
  quizzes:     <Quizzes />,
  leaderboard: <Leaderboard />,
  attendance:  <Attendance />,
  timetable:   <Timetable />,
  chatroom:    <ChatRoom />,
};

export default function App() {
  const { user, activeTab } = useApp();
  if (!user) return <AuthScreen />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Topbar />
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0, background: 'var(--bg-base)' }}>
        {PAGES[activeTab] ?? <Dashboard />}
      </main>
    </div>
  );
}
