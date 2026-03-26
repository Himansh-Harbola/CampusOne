import { supabase } from './supabase'

// ════════════════════════════════════════════════════════════
// PROFILES
// ════════════════════════════════════════════════════════════

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ════════════════════════════════════════════════════════════
// CLASSES
// ════════════════════════════════════════════════════════════

export async function getClasses(userId, role) {
  if (role === 'teacher') {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        enrollments(student_id),
        lectures(*)
      `)
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        class_id,
        classes(
          *,
          enrollments(student_id),
          lectures(*)
        )
      `)
      .eq('student_id', userId)
    if (error) throw error
    return data.map(e => e.classes)
  }
}

export async function getAllClassesForStudent() {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      enrollments(student_id),
      lectures(*),
      profiles!classes_teacher_id_fkey(name, department, avatar)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createClass({ name, code, teacherId }) {
  const { data, error } = await supabase
    .from('classes')
    .insert({ name, code, teacher_id: teacherId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function enrollStudent(classId, studentId) {
  const { error } = await supabase
    .from('enrollments')
    .insert({ class_id: classId, student_id: studentId })
  if (error && error.code !== '23505') throw error // ignore duplicate
}

export async function unenrollStudent(classId, studentId) {
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('class_id', classId)
    .eq('student_id', studentId)
  if (error) throw error
}

// ════════════════════════════════════════════════════════════
// LECTURES
// ════════════════════════════════════════════════════════════

export async function addLecture({ classId, title, duration, videoUrl }) {
  const { data, error } = await supabase
    .from('lectures')
    .insert({
      class_id: classId,
      title,
      duration: duration || '—',
      video_url: videoUrl || '',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getLectures(classId) {
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// ════════════════════════════════════════════════════════════
// QUIZZES
// ════════════════════════════════════════════════════════════

export async function getQuizzes(userId, role, classIds) {
  if (role === 'teacher') {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`*, quiz_questions(*), quiz_submissions(*)`)
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  } else {
    if (!classIds?.length) return []
    const { data, error } = await supabase
      .from('quizzes')
      .select(`*, quiz_questions(*), quiz_submissions(*)`)
      .in('class_id', classIds)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
}

export async function createQuiz({ title, classId, teacherId, deadline, questions }) {
  const maxScore = questions.length * 10

  const { data: quiz, error: qError } = await supabase
    .from('quizzes')
    .insert({
      title,
      class_id: classId,
      teacher_id: teacherId,
      deadline,
      status: new Date(deadline) > new Date() ? 'upcoming' : 'active',
      max_score: maxScore,
    })
    .select()
    .single()
  if (qError) throw qError

  const questionRows = questions.map((q, i) => ({
    quiz_id: quiz.id,
    text: q.text,
    options: q.options,
    correct_index: q.correct,
    position: i,
  }))

  const { error: qqError } = await supabase
    .from('quiz_questions')
    .insert(questionRows)
  if (qqError) throw qqError

  return quiz
}

export async function submitQuiz({ quizId, studentId, answers, score }) {
  const { data, error } = await supabase
    .from('quiz_submissions')
    .insert({
      quiz_id: quizId,
      student_id: studentId,
      answers,
      score,
    })
    .select()
    .single()
  if (error) throw error

  // Update student points
  await supabase.rpc('increment_points', { uid: studentId, amount: score })

  return data
}

// ════════════════════════════════════════════════════════════
// ATTENDANCE
// ════════════════════════════════════════════════════════════

export async function getAttendance(classId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('class_id', classId)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function saveAttendance(classId, date, records) {
  // records: [{ studentId, present }]
  const rows = records.map(r => ({
    class_id: classId,
    student_id: r.studentId,
    date,
    present: r.present,
  }))

  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'class_id,student_id,date' })
  if (error) throw error
}

export async function getStudentAttendance(studentId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, classes(name, code)')
    .eq('student_id', studentId)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

// ════════════════════════════════════════════════════════════
// CHATROOMS
// ════════════════════════════════════════════════════════════

export async function getChatrooms(classIds) {
  if (!classIds?.length) return []
  const { data, error } = await supabase
    .from('chatrooms')
    .select('*, classes(name, code)')
    .in('class_id', classIds)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createChatroom({ name, classId, createdBy }) {
  const { data, error } = await supabase
    .from('chatrooms')
    .insert({ name, class_id: classId, created_by: createdBy })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getMessages(chatroomId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles(name, avatar, role)')
    .eq('chatroom_id', chatroomId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function sendMessage({ chatroomId, userId, text }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ chatroom_id: chatroomId, user_id: userId, text })
    .select('*, profiles(name, avatar, role)')
    .single()
  if (error) throw error
  return data
}

// ════════════════════════════════════════════════════════════
// LIVE SESSIONS
// ════════════════════════════════════════════════════════════

export async function getLiveSessions(classIds) {
  if (!classIds?.length) return []
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*, classes(name, code, teacher_id, profiles!classes_teacher_id_fkey(name, avatar))')
    .in('class_id', classIds)
    .eq('is_live', true)
    .order('started_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAllLiveSessions() {
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*, classes(name, code, teacher_id, profiles!classes_teacher_id_fkey(name, avatar))')
    .eq('is_live', true)
    .order('started_at', { ascending: false })
  if (error) throw error
  return data
}

export async function startLiveSession({ classId, teacherId, title, roomName }) {
  // End any existing live session for this class first
  await supabase
    .from('live_sessions')
    .update({ is_live: false, ended_at: new Date().toISOString() })
    .eq('class_id', classId)
    .eq('is_live', true)

  const { data, error } = await supabase
    .from('live_sessions')
    .insert({
      class_id: classId,
      teacher_id: teacherId,
      title,
      room_name: roomName,
      is_live: true,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function endLiveSession(sessionId) {
  const { error } = await supabase
    .from('live_sessions')
    .update({ is_live: false, ended_at: new Date().toISOString() })
    .eq('id', sessionId)
  if (error) throw error
}

export async function getClassLiveSession(classId) {
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('class_id', classId)
    .eq('is_live', true)
    .maybeSingle()
  if (error) throw error
  return data
}

// ════════════════════════════════════════════════════════════
// LEADERBOARD
// ════════════════════════════════════════════════════════════

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar, points, lectures_watched, department, role')
    .eq('role', 'student')
    .order('points', { ascending: false })
  if (error) throw error
  return data
}
