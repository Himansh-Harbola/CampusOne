import { useApp } from './context/AppContext';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Quizzes from './pages/Quizzes';
import Leaderboard from './pages/Leaderboard';
import Attendance from './pages/Attendance';
import ChatRoom from './pages/ChatRoom';

const PAGES = {
  dashboard:   <Dashboard />,
  classes:     <Classes />,
  quizzes:     <Quizzes />,
  leaderboard: <Leaderboard />,
  attendance:  <Attendance />,
  chatroom:    <ChatRoom />,
};

export default function App() {
  const { user, activeTab } = useApp();

  if (!user) return <AuthScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          minWidth: 0,
          background: '#0f1117',
        }}
      >
        {PAGES[activeTab] ?? <Dashboard />}
      </main>
    </div>
  );
}
