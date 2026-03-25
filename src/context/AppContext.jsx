import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile, signOut as authSignOut } from '../lib/auth'

const AppContext = createContext(null)

export const APP_NAME    = 'CampusOne'
export const APP_TAGLINE = 'Every lecture, every grade, every moment — one campus.'

export function AppProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [theme, setTheme]         = useState(() => localStorage.getItem('co-theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('co-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  function userFromSession(session) {
    const meta = session.user.user_metadata || {}
    return {
      id:         session.user.id,
      email:      session.user.email,
      name:       meta.name       || session.user.email,
      role:       meta.role       || 'student',
      department: meta.department || '',
      roll_no:    meta.roll_no    || '',
      avatar:     meta.avatar     || (session.user.email?.[0] || '?').toUpperCase(),
    }
  }

  async function loadUser(sessionUser) {
    try {
      const profile = await getProfile(sessionUser.id)
      setUser(profile)
    } catch {
      setUser(userFromSession({ user: sessionUser }))
    }
  }

  useEffect(() => {
    // Step 1: getSession() for the initial load — this is required in supabase-js v2
    // to get the persisted session from localStorage immediately.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))

    // Step 2: onAuthStateChange for login/logout events AFTER initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          loadUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setActiveTab('dashboard')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function logout() {
    await authSignOut()
    setUser(null)
    setActiveTab('dashboard')
  }

  async function refreshUser() {
    if (!user?.id) return
    try {
      const profile = await getProfile(user.id)
      setUser(profile)
    } catch {}
  }

  const value = {
    user, setUser,
    loading,
    activeTab, setActiveTab,
    theme, toggleTheme,
    logout, refreshUser,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
