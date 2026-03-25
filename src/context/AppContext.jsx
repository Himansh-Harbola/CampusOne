import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile, signOut as authSignOut } from '../lib/auth'

const AppContext = createContext(null)

export const APP_NAME    = 'CampusOne'
export const APP_TAGLINE = 'Every lecture, every grade, every moment — one campus.'

export function AppProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [theme, setTheme]       = useState(() => localStorage.getItem('co-theme') || 'light')

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('co-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  // Listen to Supabase auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const profile = await getProfile(session.user.id)
          setUser(profile)
        } catch {
          setUser(null)
        }
      }
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const profile = await getProfile(session.user.id)
            setUser(profile)
          } catch {
            setUser(null)
          }
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

  // Refresh profile from DB (call after updates)
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
