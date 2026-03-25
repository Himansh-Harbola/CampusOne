import { supabase } from './supabase'

export async function signUp({ email, password, name, role, department, rollNo }) {
  const avatar = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name, role, department, roll_no: rollNo, avatar } },
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
  // First try — immediate
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (data) return data

  // Profile not found — trigger may have missed it. Wait 1s then try once more.
  await new Promise(r => setTimeout(r, 1000))

  const { data: data2, error: error2 } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (data2) return data2

  // Still not found — manually create it from auth user metadata
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No authenticated user found')

  const meta = user.user_metadata || {}
  const avatar = (meta.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert({
      id:         userId,
      name:       meta.name       || 'User',
      role:       meta.role       || 'student',
      department: meta.department || '',
      roll_no:    meta.roll_no    || '',
      avatar:     meta.avatar     || avatar,
      points:     0,
      lectures_watched: 0,
    })
    .select()
    .single()

  if (createError) throw new Error('Profile setup failed: ' + createError.message)
  return created
}

export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => callback(session)
  )
  return subscription
}
