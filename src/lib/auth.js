import { supabase } from './supabase'

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

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getProfile(userId) {
  // Retry up to 5 times with delay — profile may not exist yet right after signup
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (data) return data

    if (error) {
      console.warn(`getProfile attempt ${attempt + 1} error:`, error.message)
    } else {
      console.warn(`getProfile attempt ${attempt + 1}: profile not found yet`)
    }

    // Wait before retrying (500ms, 1s, 1.5s, 2s, 2.5s)
    await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
  }

  throw new Error('Profile could not be loaded. Please try signing in again.')
}

export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => callback(session)
  )
  return subscription
}