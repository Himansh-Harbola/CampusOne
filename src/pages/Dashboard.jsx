import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getClasses, getAllClassesForStudent, getQuizzes } from '../lib/db'
import Page from '../components/ui/Page'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'

function getGreeting() {
  const h = new Date().getHours()
  if(h<12) return 'Good morning'
  if(h<17) return 'Good afternoon'
  return 'Good evening'
}

function TeacherDashboard() {
  const { user } = useApp()
  const [classes, setClasses]   = useState([])
  const [quizzes, setQuizzes]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const cls = await getClasses(user.id, 'teacher')
        const q   = await getQuizzes(user.id, 'teacher')
        setClasses(cls||[])
        setQuizzes(q||[])
      } catch(e){ console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user.id])

  const totalStudents = new Set(classes.flatMap(c=>(c.enrollments||[]).map(e=>e.student_id))).size
  const totalLectures = classes.reduce((a,c)=>a+(c.lectures||[]).length, 0)

  return (
    <Page title={`${getGreeting()}, ${user.name?.split(' ')[0]} 👋`} subtitle={`${user.department||'Teacher'} · ${new Date().toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})}`}>
      {loading ? <p style={{color:'var(--text-muted)'}}>Loading…</p> : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px,1fr))', gap:16, marginBottom:24 }}>
            <StatCard label="My Classes"    value={classes.length}                                          icon="📚" />
            <StatCard label="Total Students" value={totalStudents}                                           icon="👥" />
            <StatCard label="Active Tests"  value={quizzes.filter(q=>q.status==='active').length}            icon="📝" />
            <StatCard label="Total Lectures" value={totalLectures}                                           icon="🎬" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <Card>
              <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-serif)' }}>📚 My Classes</h3>
              {classes.length===0 ? <p style={{color:'var(--text-muted)',fontSize:13}}>No classes created yet.</p> :
                classes.map(c => (
                  <div key={c.id} style={{ padding:'12px 14px', background:'var(--bg-elevated)', borderRadius:10, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid var(--border-dim)' }}>
                    <div>
                      <p style={{ margin:0, fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{c.name}</p>
                      <p style={{ margin:'3px 0 0', fontSize:12, color:'var(--text-muted)' }}>{c.code} · {(c.enrollments||[]).length} students</p>
                    </div>
                    <Badge variant="default">{(c.lectures||[]).length} lectures</Badge>
                  </div>
                ))}
              {quizzes.filter(q=>q.status==='active').length>0 && (
                <>
                  <p style={{ margin:'16px 0 10px', fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Active Tests</p>
                  {quizzes.filter(q=>q.status==='active').map(q => (
                    <div key={q.id} style={{ padding:'10px 14px', background:'var(--warning-bg)', borderRadius:9, marginBottom:8, border:'1px solid var(--warning)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{q.title}</p>
                      <Badge variant="warning">{(q.quiz_submissions||[]).length} submitted</Badge>
                    </div>
                  ))}
                </>
              )}
            </Card>
          </div>
        </>
      )}
    </Page>
  )
}

function StudentDashboard() {
  const { user } = useApp()
  const [classes, setClasses]   = useState([])
  const [quizzes, setQuizzes]   = useState([])
  const [rank, setRank]         = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const allCls  = await getAllClassesForStudent()
        const myCls   = (allCls||[]).filter(c=>(c.enrollments||[]).some(e=>e.student_id===user.id))
        setClasses(myCls)
        const q = await (myCls.length ? getQuizzes(user.id,'student',myCls.map(c=>c.id)) : Promise.resolve([]))
        setQuizzes(q||[])
      } catch(e){ console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user.id])

  const pending  = quizzes.filter(q=>q.status==='active' && !(q.quiz_submissions||[]).some(s=>s.student_id===user.id))
  const upcoming = quizzes.filter(q=>q.status==='upcoming')

  return (
    <Page title={`${getGreeting()}, ${user.name?.split(' ')[0]} 👋`} subtitle={`${user.department||'Student'} · Roll No: ${user.roll_no||'—'}`}>
      {loading ? <p style={{color:'var(--text-muted)'}}>Loading…</p> : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(175px,1fr))', gap:16, marginBottom:24 }}>
            <StatCard label="Lectures Watched" value={user.lectures_watched||0} icon="🎬" />
            <StatCard label="Total Points"     value={user.points||0}            icon="⭐" />
            <StatCard label="Enrolled Classes" value={classes.length}            icon="📚" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Card>
                <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-serif)' }}>🔥 Pending Tests</h3>
                {pending.length===0 ? <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'12px 0' }}>No pending tests! 🎉</p> :
                  pending.map(q => {
                    const cls = classes.find(c=>c.id===q.class_id)
                    return (
                      <div key={q.id} style={{ padding:'11px 14px', borderRadius:10, marginBottom:8, background:'var(--danger-bg)', border:'1px solid var(--danger)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                          <div>
                            <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{q.title}</p>
                            <p style={{ margin:'2px 0 0', fontSize:11, color:'var(--text-muted)' }}>{cls?.name}</p>
                          </div>
                          <Badge variant="danger">Due {new Date(q.deadline).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}</Badge>
                        </div>
                      </div>
                    )
                  })}
                {upcoming.length>0 && (
                  <>
                    <p style={{ margin:'12px 0 8px', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Upcoming</p>
                    {upcoming.map(q=>(
                      <div key={q.id} style={{ padding:'9px 14px', background:'var(--bg-elevated)', borderRadius:9, marginBottom:6, border:'1px solid var(--border-dim)' }}>
                        <p style={{ margin:0, fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{q.title}</p>
                        <p style={{ margin:'2px 0 0', fontSize:11, color:'var(--text-muted)' }}>Opens {new Date(q.deadline).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}</p>
                      </div>
                    ))}
                  </>
                )}
              </Card>
              <Card style={{ background:'var(--accent-light)', border:'1px solid var(--accent)' }}>
                <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Total Points</p>
                <p style={{ margin:'0 0 4px', fontSize:44, fontFamily:'var(--font-display)', color:'var(--accent-text)', lineHeight:1 }}>{user.points||0}</p>
                <p style={{ margin:0, fontSize:13, color:'var(--text-secondary)' }}>Keep attending and acing tests!</p>
              </Card>
            </div>
          </div>
        </>
      )}
    </Page>
  )
}

export default function Dashboard() {
  const { user } = useApp()
  return user.role==='teacher' ? <TeacherDashboard /> : <StudentDashboard />
}
