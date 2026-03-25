import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getQuizzes, createQuiz, submitQuiz, getClasses, getAllClassesForStudent } from '../lib/db'
import Page from '../components/ui/Page'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Btn from '../components/ui/Btn'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import { getAllProfiles } from '../lib/db'

const selectStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)', marginBottom: 16 }

function QuizCard({ quiz, cls, onClick, onAttempt, mySubmission }) {
  const [hov, setHov] = useState(false)
  const subCount = (quiz.quiz_submissions || []).length
  const pct = mySubmission ? Math.round((mySubmission.score / quiz.max_score) * 100) : null
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'var(--bg-surface)', border: `1px solid ${hov ? 'var(--accent)' : 'var(--border-dim)'}`, borderRadius: 16, padding: '20px 22px', cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.2s', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Badge variant={quiz.status === 'active' ? 'success' : 'warning'}>{quiz.status}</Badge>
        {pct != null && <Badge variant={pct >= 70 ? 'success' : 'danger'}>{mySubmission.score}/{quiz.max_score}</Badge>}
      </div>
      <h3 style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{quiz.title}</h3>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-muted)' }}>
        {cls?.name} · Due {new Date(quiz.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge variant="muted">{(quiz.quiz_questions || []).length} questions</Badge>
          {subCount > 0 && <Badge variant="success">{subCount} submitted</Badge>}
        </div>
        {onAttempt && !mySubmission && quiz.status === 'active' && (
          <Btn small onClick={e => { e.stopPropagation(); onAttempt() }}>Attempt</Btn>
        )}
      </div>
    </div>
  )
}

function TeacherQuizDetail({ quiz, allProfiles, onBack }) {
  const cls = quiz.classData
  const subs = quiz.quiz_submissions || []
  return (
    <Page title={quiz.title} subtitle={`${cls?.name} · ${subs.length} submissions`} actions={<Btn variant="secondary" onClick={onBack}>← Back</Btn>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>Questions ({(quiz.quiz_questions || []).length})</h3>
          {(quiz.quiz_questions || []).sort((a,b) => a.position-b.position).map((q, i) => (
            <div key={q.id} style={{ marginBottom: 16, padding: '14px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-dim)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{i+1}. {q.text}</p>
              {(q.options || []).map((opt, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${j === q.correct_index ? 'var(--accent)' : 'var(--border-subtle)'}`, background: j === q.correct_index ? 'var(--accent)' : 'transparent', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: j === q.correct_index ? 'var(--accent)' : 'var(--text-secondary)' }}>{opt}</span>
                </div>
              ))}
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>Student Scores</h3>
          {subs.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No submissions yet</p> :
            subs.map((sub, i) => {
              const student = allProfiles.find(p => p.id === sub.student_id)
              const pct = Math.round((sub.score / quiz.max_score) * 100)
              return (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-dim)' }}>
                  <Avatar initials={student?.avatar || '?'} size={32} colorIndex={i} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{student?.name || 'Student'}</p>
                    <div style={{ height: 4, background: 'var(--border-dim)', borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct>=70?'var(--success)':pct>=50?'var(--warning)':'var(--danger)', borderRadius: 2 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: pct>=70?'var(--success)':pct>=50?'var(--warning)':'var(--danger)', fontFamily: 'var(--font-display)' }}>{sub.score}/{quiz.max_score}</span>
                </div>
              )
            })}
        </Card>
      </div>
    </Page>
  )
}

function CreateQuizModal({ onClose, myClasses, onCreate }) {
  const { user } = useApp()
  const [title, setTitle]     = useState('')
  const [classId, setClassId] = useState('')
  const [deadline, setDeadline] = useState('')
  const [questions, setQuestions] = useState([{ text: '', options: ['','','',''], correct: 0 }])
  const [saving, setSaving]   = useState(false)

  function updateQ(qi, key, val) { setQuestions(p => { const n=[...p]; n[qi]={...n[qi],[key]:val}; return n }) }
  function updateOpt(qi, oi, val) { setQuestions(p => { const n=[...p]; const o=[...n[qi].options]; o[oi]=val; n[qi]={...n[qi],options:o}; return n }) }

  async function handleCreate() {
    if (!title || !classId || !deadline) return
    setSaving(true)
    try {
      const q = await createQuiz({ title, classId, teacherId: user.id, deadline, questions })
      onCreate(q)
      onClose()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal title="Create Test" onClose={onClose} wide>
      <Input label="Test Title *" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mid-Term Test" />
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Class *</label>
        <select value={classId} onChange={e => setClassId(e.target.value)} style={selectStyle}>
          <option value="">Select class</option>
          {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <Input label="Deadline *" type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
      <h4 style={{ margin: '16px 0 12px', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>Questions</h4>
      {questions.map((q, qi) => (
        <div key={qi} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 10, border: '1px solid var(--border-dim)' }}>
          <input value={q.text} onChange={e => updateQ(qi,'text',e.target.value)} placeholder={`Question ${qi+1}`}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 10, fontFamily: 'var(--font-body)' }} />
          {q.options.map((opt, oi) => (
            <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <button onClick={() => updateQ(qi,'correct',oi)} style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${oi===q.correct?'var(--accent)':'var(--border-subtle)'}`, background: oi===q.correct?'var(--accent)':'transparent', cursor: 'pointer', flexShrink: 0, padding: 0 }} />
              <input value={opt} onChange={e => updateOpt(qi,oi,e.target.value)} placeholder={`Option ${oi+1}`}
                style={{ flex: 1, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-body)' }} />
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Btn variant="secondary" small onClick={() => setQuestions(p => [...p, { text:'', options:['','','',''], correct:0 }])}>+ Add Question</Btn>
        <Btn onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create Test'}</Btn>
      </div>
    </Modal>
  )
}

function TeacherQuizzes() {
  const { user } = useApp()
  const [quizzes, setQuizzes]   = useState([])
  const [classes, setClasses]   = useState([])
  const [profiles, setProfiles] = useState([])
  const [selected, setSelected] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [cls, q, p] = await Promise.all([
          getClasses(user.id, 'teacher'),
          getQuizzes(user.id, 'teacher'),
          getAllProfiles(),
        ])
        setClasses(cls || [])
        setQuizzes(q || [])
        setProfiles(p || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user.id])

  if (selected) {
    const cls = classes.find(c => c.id === selected.class_id)
    return <TeacherQuizDetail quiz={{ ...selected, classData: cls }} allProfiles={profiles} onBack={() => setSelected(null)} />
  }

  return (
    <Page title="Tests" subtitle="Create tests and track student performance" actions={<Btn onClick={() => setShowCreate(true)}>+ Create Test</Btn>}>
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading…</p> :
        quizzes.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>📝</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No tests yet</p>
            <Btn onClick={() => setShowCreate(true)}>Create First Test</Btn>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 16 }}>
            {quizzes.map(q => <QuizCard key={q.id} quiz={q} cls={classes.find(c => c.id === q.class_id)} onClick={() => setSelected(q)} />)}
          </div>
        )}
      {showCreate && <CreateQuizModal onClose={() => setShowCreate(false)} myClasses={classes} onCreate={q => setQuizzes(p => [{ ...q, quiz_questions: [], quiz_submissions: [] }, ...p])} />}
    </Page>
  )
}

function AttemptQuiz({ quiz, onDone, onBack }) {
  const { user } = useApp()
  const [answers, setAnswers] = useState({})
  const [result, setResult]   = useState(null)
  const [saving, setSaving]   = useState(false)
  const questions = (quiz.quiz_questions || []).sort((a,b) => a.position - b.position)

  async function handleSubmit() {
    setSaving(true)
    let score = 0
    questions.forEach((q, i) => { if (answers[i] === q.correct_index) score += Math.floor(quiz.max_score / questions.length) })
    try {
      await submitQuiz({ quizId: quiz.id, studentId: user.id, answers: Object.values(answers), score })
      setResult({ score, max: quiz.max_score })
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  if (result) {
    const pct = Math.round((result.score / result.max) * 100)
    return (
      <Page title="Test Submitted!" actions={<Btn onClick={onDone}>← Back to Tests</Btn>}>
        <Card style={{ textAlign: 'center', padding: '60px 40px' }}>
          <p style={{ fontSize: 64, marginBottom: 8 }}>{pct>=70?'🎉':pct>=50?'👍':'😔'}</p>
          <p style={{ fontSize: 40, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: '0 0 6px' }}>{result.score}/{result.max}</p>
          <p style={{ fontSize: 22, color: pct>=70?'var(--success)':pct>=50?'var(--warning)':'var(--danger)', margin: '0 0 10px' }}>{pct}%</p>
          <p style={{ color: 'var(--text-muted)' }}>{pct>=70?'Excellent work!':pct>=50?'Good effort!':'Keep practising!'}</p>
        </Card>
      </Page>
    )
  }

  return (
    <Page title={quiz.title} subtitle={`${questions.length} questions · ${quiz.max_score} marks`}
      actions={<><Btn variant="secondary" onClick={onBack}>← Back</Btn><Btn onClick={handleSubmit} disabled={saving || Object.keys(answers).length < questions.length}>{saving ? 'Submitting…' : 'Submit Test'}</Btn></>}>
      {questions.map((q, i) => (
        <Card key={q.id} style={{ marginBottom: 14 }}>
          <p style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{i+1}. {q.text}</p>
          {(q.options || []).map((opt, j) => (
            <button key={j} onClick={() => setAnswers(p => ({ ...p, [i]: j }))}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${answers[i]===j?'var(--accent)':'var(--border-dim)'}`, background: answers[i]===j?'var(--accent-light)':'transparent', color: answers[i]===j?'var(--accent-text)':'var(--text-secondary)', fontSize: 14, cursor: 'pointer', marginBottom: 8, textAlign: 'left', fontFamily: 'var(--font-body)' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${answers[i]===j?'var(--accent)':'var(--border-subtle)'}`, background: answers[i]===j?'var(--accent)':'transparent', flexShrink: 0 }} />
              {opt}
            </button>
          ))}
        </Card>
      ))}
    </Page>
  )
}

function StudentQuizzes() {
  const { user } = useApp()
  const [quizzes, setQuizzes]   = useState([])
  const [classes, setClasses]   = useState([])
  const [attempting, setAttempting] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const cls = await getAllClassesForStudent()
        const myCls = (cls || []).filter(c => (c.enrollments||[]).some(e => e.student_id === user.id))
        setClasses(myCls)
        if (myCls.length > 0) {
          const q = await getQuizzes(user.id, 'student', myCls.map(c => c.id))
          setQuizzes(q || [])
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user.id])

  if (attempting) return <AttemptQuiz quiz={attempting} onDone={() => { setAttempting(null); window.location.reload() }} onBack={() => setAttempting(null)} />

  return (
    <Page title="Tests" subtitle="Attempt active tests and view your results">
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading…</p> :
        quizzes.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '60px' }}><p style={{ color: 'var(--text-muted)' }}>No tests available yet</p></Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 16 }}>
            {quizzes.map(q => {
              const mySub = (q.quiz_submissions||[]).find(s => s.student_id === user.id)
              return <QuizCard key={q.id} quiz={q} cls={classes.find(c => c.id === q.class_id)} mySubmission={mySub} onAttempt={() => setAttempting(q)} />
            })}
          </div>
        )}
    </Page>
  )
}

export default function Quizzes() {
  const { user } = useApp()
  return user.role === 'teacher' ? <TeacherQuizzes /> : <StudentQuizzes />
}
