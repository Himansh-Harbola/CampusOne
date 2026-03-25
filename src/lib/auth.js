import { supabase } from './supabase'

// ── Sign Up ──────────────────────────────────────────────────
export async function signUp({ email, password, name, role, department, rollNo }) {
  const avatar = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role, department, roll_no: rollNo, avatar },
    },
  })

  if (error) throw error
  return data
}

// ── Sign In ──────────────────────────────────────────────────
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

// ── Sign Out ─────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ── Get current session ──────────────────────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ── Get profile from DB ──────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// ── Listen to auth state changes ─────────────────────────────
export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => callback(session)
  )
  return subscription
}
