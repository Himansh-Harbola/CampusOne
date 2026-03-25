import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile, signOut as authSignOut } from '../lib/auth'

const AppContext = createContext(null)

export const APP_NAME    = 'CampusOne'
export const APP_TAGLINE = 'Every lecture, every grade, every moment — one campus.'

export function AppProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [theme, setTheme]         = useState(() => localStorage.getItem('co-theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('co-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    let initialUserId = null

    // Get initial session — this is the ONLY place we load profile on boot
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        initialUserId = session.user.id
        try {
          const profile = await getProfile(session.user.id)
          setUser(profile)
        } catch (e) {
          console.error('Failed to load profile:', e.message)
          await supabase.auth.signOut()
          setUser(null)
          setAuthError('Could not load your profile. Please sign in again.')
        }
      }
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Skip if this is the same user already loaded by getSession() above
          if (session.user.id === initialUserId) return
          initialUserId = session.user.id
          setLoading(true)
          try {
            const profile = await getProfile(session.user.id)
            setUser(profile)
            setAuthError('')
          } catch (e) {
            console.error('Auth state change profile error:', e.message)
            setAuthError('Could not load your profile. Please try again.')
            initialUserId = null
            await supabase.auth.signOut()
            setUser(null)
          } finally {
            setLoading(false)
          }
        } else if (event === 'SIGNED_OUT') {
          initialUserId = null
          setUser(null)
          setActiveTab('dashboard')
          setLoading(false)
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
    authError, setAuthError,
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
