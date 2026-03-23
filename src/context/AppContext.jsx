import { createContext, useContext, useState, useEffect } from 'react';
import {
  MOCK_USERS, INITIAL_CLASSES, INITIAL_QUIZZES,
  INITIAL_CHATROOMS, INITIAL_ATTENDANCE,
} from '../data/mockData';

const AppContext = createContext(null);

export const APP_NAME = 'CampusOne';
export const APP_TAGLINE = 'Every lecture, every grade, every moment — one campus.';

export function AppProvider({ children }) {
  const [user, setUser]             = useState(null);
  const [allUsers, setAllUsers]     = useState(MOCK_USERS);
  const [classes, setClasses]       = useState(INITIAL_CLASSES);
  const [quizzes, setQuizzes]       = useState(INITIAL_QUIZZES);
  const [chatrooms, setChatrooms]   = useState(INITIAL_CHATROOMS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [theme, setTheme]           = useState(() => localStorage.getItem('co-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('co-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  function login(u, users) {
    setUser(u);
    if (users) setAllUsers(users);
    setActiveTab('dashboard');
  }

  function logout() {
    setUser(null);
    setActiveTab('dashboard');
  }

  function signup(formData, role) {
    const initials = formData.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const newUser = { id: 'u' + Date.now(), ...formData, role, avatar: initials, points: 0, lecturesWatched: 0 };
    const updated = [...allUsers, newUser];
    setAllUsers(updated);
    login(newUser, updated);
  }

  const value = {
    user, allUsers,
    classes, setClasses,
    quizzes, setQuizzes,
    chatrooms, setChatrooms,
    attendance, setAttendance,
    activeTab, setActiveTab,
    theme, toggleTheme,
    login, logout, signup,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
