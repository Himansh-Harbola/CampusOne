import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getClasses, getAllClassesForStudent, getAttendance, getStudentAttendance, getQuizzes } from '../lib/db'
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
  const [attData, setAttData]   = useState({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const cls = await getClasses(user.id, 'teacher')
        const q   = await getQuizzes(user.id, 'teacher')
        setClasses(cls||[])
        setQuizzes(q||[])
        // Load attendance for each class
        const attMap = {}
        await Promise.all((cls||[]).map(async c => {
          const records = await getAttendance(c.id)
          attMap[c.id] = records||[]
        }))
        setAttData(attMap)
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
              <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-serif)' }}>✅ Attendance Overview</h3>
              {classes.length===0 ? <p style={{color:'var(--text-muted)',fontSize:13}}>No classes yet</p> :
                classes.map(cls => {
                  const records  = attData[cls.id]||[]
                  const students = (cls.enrollments||[]).map(e=>e.student_id)
                  const dates    = [...new Set(records.map(r=>r.date))].sort()
                  const totalPres = records.filter(r=>r.present).length
                  const maxPres   = dates.length * students.length
                  const pct       = maxPres ? Math.round((totalPres/maxPres)*100) : 0
                  const byDate    = {}
                  dates.forEach(d => { byDate[d] = records.filter(r=>r.date===d) })

                  return (
                    <div key={cls.id} style={{ marginBottom:16, padding:'14px', background:'var(--bg-elevated)', borderRadius:10, border:'1px solid var(--border-dim)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                        <div>
                          <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{cls.name}</p>
                          <p style={{ margin:'2px 0 0', fontSize:11, color:'var(--text-muted)' }}>{cls.code} · {students.length} students · {dates.length} sessions</p>
                        </div>
                        <span style={{ fontSize:18, fontFamily:'var(--font-display)', fontWeight:700, color:pct>=75?'var(--success)':pct>=50?'var(--warning)':'var(--danger)' }}>{pct}%</span>
                      </div>
                      {dates.length>0 && (
                        <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:60 }}>
                          {dates.map(d => {
                            const dayRecs = byDate[d]||[]
                            const dayPres = dayRecs.filter(r=>r.present).length
                            const dayPct  = students.length ? Math.round((dayPres/students.length)*100) : 0
                            return (
                              <div key={d} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                                <span style={{ fontSize:9, color:'var(--text-muted)', fontWeight:600 }}>{dayPct}%</span>
                                <div style={{ width:'100%', height:40, background:'var(--border-dim)', borderRadius:3, overflow:'hidden', display:'flex', alignItems:'flex-end' }}>
                                  <div style={{ width:'100%', height:`${dayPct}%`, background:dayPct>=75?'var(--success)':dayPct>=50?'var(--warning)':'var(--danger)', borderRadius:3 }} />
                                </div>
                                <span style={{ fontSize:9, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{d.slice(5)}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
            </Card>
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
  const [attData, setAttData]   = useState([])
  const [rank, setRank]         = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const allCls  = await getAllClassesForStudent()
        const myCls   = (allCls||[]).filter(c=>(c.enrollments||[]).some(e=>e.student_id===user.id))
        setClasses(myCls)
        const [att, q] = await Promise.all([
          getStudentAttendance(user.id),
          myCls.length ? getQuizzes(user.id,'student',myCls.map(c=>c.id)) : Promise.resolve([]),
        ])
        setAttData(att||[])
        setQuizzes(q||[])
      } catch(e){ console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user.id])

  const pending  = quizzes.filter(q=>q.status==='active' && !(q.quiz_submissions||[]).some(s=>s.student_id===user.id))
  const upcoming = quizzes.filter(q=>q.status==='upcoming')
  const overallPct = (() => {
    const p = attData.filter(a=>a.present).length
    return attData.length ? Math.round((p/attData.length)*100) : 0
  })()

  return (
    <Page title={`${getGreeting()}, ${user.name?.split(' ')[0]} 👋`} subtitle={`${user.department||'Student'} · Roll No: ${user.roll_no||'—'}`}>
      {loading ? <p style={{color:'var(--text-muted)'}}>Loading…</p> : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(175px,1fr))', gap:16, marginBottom:24 }}>
            <StatCard label="Lectures Watched" value={user.lectures_watched||0} icon="🎬" />
            <StatCard label="Overall Attendance" value={`${overallPct}%`}        icon="✅" />
            <StatCard label="Total Points"     value={user.points||0}            icon="⭐" />
            <StatCard label="Enrolled Classes" value={classes.length}            icon="📚" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <Card>
              <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-serif)' }}>✅ My Attendance</h3>
              {classes.length===0 ? <p style={{color:'var(--text-muted)',fontSize:13}}>Enroll in classes to see attendance</p> :
                classes.map(c => {
                  const clsAtt = attData.filter(a=>a.class_id===c.id)
                  const pres   = clsAtt.filter(a=>a.present).length
                  const total  = clsAtt.length
                  const pct    = total ? Math.round((pres/total)*100) : 0
                  return (
                    <div key={c.id} style={{ marginBottom:16, padding:'14px', background:'var(--bg-elevated)', borderRadius:10, border:'1px solid var(--border-dim)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <div>
                          <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{c.name}</p>
                          <p style={{ margin:'2px 0 0', fontSize:11, color:'var(--text-muted)' }}>{pres}/{total} classes attended</p>
                        </div>
                        <span style={{ fontSize:20, fontFamily:'var(--font-display)', fontWeight:700, color:pct>=75?'var(--success)':pct>=50?'var(--warning)':'var(--danger)' }}>{pct}%</span>
                      </div>
                      <div style={{ height:5, background:'var(--border-dim)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:pct>=75?'var(--success)':pct>=50?'var(--warning)':'var(--danger)', borderRadius:3 }} />
                      </div>
                      {clsAtt.length>0 && (
                        <div style={{ display:'flex', gap:3, marginTop:8, flexWrap:'wrap' }}>
                          {clsAtt.sort((a,b)=>a.date.localeCompare(b.date)).map(a=>(
                            <div key={a.id} title={a.date} style={{ width:10, height:10, borderRadius:2, background:a.present?'var(--success)':'var(--danger)', opacity:0.8 }} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
            </Card>
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
