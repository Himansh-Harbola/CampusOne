import { supabase } from './supabase'

// Save or update notes for a lecture or live session
export async function saveNotes({ lectureId, sessionId, userId, transcript, notes }) {
  const payload = {
    user_id: userId,
    transcript,
    notes,
    ...(lectureId ? { lecture_id: lectureId } : {}),
    ...(sessionId ? { session_id: sessionId } : {}),
  }

  // Upsert — one notes row per user per lecture/session
  const matchColumn = lectureId ? 'lecture_id' : 'session_id'
  const matchValue  = lectureId || sessionId

  // Check if row already exists for this user + lecture/session
  const { data: existing } = await supabase
    .from('lecture_notes')
    .select('id')
    .eq(matchColumn, matchValue)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('lecture_notes')
      .update({ transcript, notes })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('lecture_notes')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// Get notes for a specific lecture for the current user
export async function getNotesByLecture(lectureId, userId) {
  const { data, error } = await supabase
    .from('lecture_notes')
    .select('*')
    .eq('lecture_id', lectureId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

// Get notes for a specific live session for the current user
export async function getNotesBySession(sessionId, userId) {
  const { data, error } = await supabase
    .from('lecture_notes')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}