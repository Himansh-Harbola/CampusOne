import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getClasses, getAllClassesForStudent, createClass, enrollStudent, unenrollStudent, addLecture, getAllProfiles } from '../lib/db'
import Page from '../components/ui/Page'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Btn from '../components/ui/Btn'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import LectureCard from '../components/LectureCard'

const selectStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)', marginBottom: 16 }

function ClassGridCard({ cls, teacher, enrolled, onClick, onJoin }) {
  const [hov, setHov] = useState(false)
  const lectures  = cls.lectures || []
  const students  = cls.enrollments || []
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'var(--bg-surface)', border: `1px solid ${hov ? 'var(--accent)' : 'var(--border-dim)'}`, borderRadius: 16, padding: '22px', cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.2s', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <Badge variant="default">{cls.code}</Badge>
        {enrolled && <Badge variant="success">Enrolled</Badge>}
      </div>
      <h3 style={{ margin: '0 0 5px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{cls.name}</h3>
      {teacher && <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-muted)' }}>{teacher.name}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge variant="success">{lectures.length} lectures</Badge>
          <Badge variant="muted">{students.length} students</Badge>
        </div>
        {onJoin && <Btn small onClick={e => { e.stopPropagation(); onJoin(cls.id) }}>Join</Btn>}
      </div>
    </div>
  )
}

// ── Teacher: class detail ─────────────────────────────────────
function TeacherClassDetail({ cls, onBack, students }) {
  const { user } = useApp()
  const [classData, setClassData] = useState(cls)
  const [showUpload, setShowUpload] = useState(false)
  const [lec, setLec] = useState({ title: '', duration: '', videoUrl: '' })
  const [saving, setSaving] = useState(false)

  async function handleAddLecture() {
    if (!lec.title) return
    setSaving(true)
    try {
      const newLec = await addLecture({ classId: cls.id, title: lec.title, duration: lec.duration, videoUrl: lec.videoUrl })
      setClassData(prev => ({ ...prev, lectures: [...(prev.lectures || []), newLec] }))
      setLec({ title: '', duration: '', videoUrl: '' })
      setShowUpload(false)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  async function toggleEnroll(studentId) {
    const enrolled = (classData.enrollments || []).some(e => e.student_id === studentId)
    try {
      if (enrolled) {
        await unenrollStudent(cls.id, studentId)
        setClassData(prev => ({ ...prev, enrollments: prev.enrollments.filter(e => e.student_id !== studentId) }))
      } else {
        await enrollStudent(cls.id, studentId)
        setClassData(prev => ({ ...prev, enrollments: [...(prev.enrollments || []), { student_id: studentId }] }))
      }
    } catch (e) { alert(e.message) }
  }

  return (
    <Page title={classData.name} subtitle={`${classData.code} · ${(classData.enrollments || []).length} students enrolled`}
      actions={<><Btn variant="secondary" onClick={onBack}>← Back</Btn><Btn onClick={() => setShowUpload(true)}>+ Upload Lecture</Btn></>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>Video Lectures ({(classData.lectures || []).length})</h3>
          {(classData.lectures || []).length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '44px' }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>🎬</p>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>No lectures yet</p>
              <Btn onClick={() => setShowUpload(true)}>Upload First Lecture</Btn>
            </Card>
          ) : (classData.lectures || []).map(l => <LectureCard key={l.id} lecture={{ ...l, videoUrl: l.video_url }} />)}
        </div>
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>All Students</h3>
          {students.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No students yet</p> :
            students.map((s, i) => {
              const enrolled = (classData.enrollments || []).some(e => e.student_id === s.id)
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border-dim)' }}>
                  <Avatar initials={s.avatar || '?'} size={30} colorIndex={i} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{s.roll_no || s.department || ''}</p>
                  </div>
                  <button onClick={() => toggleEnroll(s.id)} style={{ padding: '4px 10px', borderRadius: 7, border: `1px solid ${enrolled ? 'var(--success)' : 'var(--border-subtle)'}`, background: enrolled ? 'var(--success-bg)' : 'transparent', color: enrolled ? 'var(--success)' : 'var(--text-muted)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
                    {enrolled ? '✓ Enrolled' : '+ Add'}
                  </button>
                </div>
              )
            })}
        </Card>
      </div>
      {showUpload && (
        <Modal title="Upload Lecture" onClose={() => setShowUpload(false)}>
          <Input label="Lecture Title *" value={lec.title} onChange={e => setLec({ ...lec, title: e.target.value })} placeholder="e.g. Introduction to Arrays" />
          <Input label="Duration" value={lec.duration} onChange={e => setLec({ ...lec, duration: e.target.value })} placeholder="e.g. 45 min" />
          <Input label="YouTube Embed URL" value={lec.videoUrl} onChange={e => setLec({ ...lec, videoUrl: e.target.value })} placeholder="https://www.youtube.com/embed/VIDEO_ID" />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '-4px 0 16px' }}>Use format: youtube.com/embed/VIDEO_ID</p>
          <Btn onClick={handleAddLecture} disabled={saving}>{saving ? 'Saving…' : 'Upload Lecture'}</Btn>
        </Modal>
      )}
    </Page>
  )
}

// ── Teacher Classes ───────────────────────────────────────────
function TeacherClasses() {
  const { user } = useApp()
  const [classes, setClasses]     = useState([])
  const [students, setStudents]   = useState([])
  const [selected, setSelected]   = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]           = useState({ name: '', code: '' })
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [cls, allProfiles] = await Promise.all([
          getClasses(user.id, 'teacher'),
          getAllProfiles(),
        ])
        setClasses(cls || [])
        setStudents((allProfiles || []).filter(p => p.role === 'student'))
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user.id])

  if (selected) return <TeacherClassDetail cls={selected} students={students} onBack={() => setSelected(null)} />

  async function handleCreate() {
    if (!form.name || !form.code) return
    setSaving(true)
    try {
      const nc = await createClass({ name: form.name, code: form.code, teacherId: user.id })
      setClasses(prev => [{ ...nc, enrollments: [], lectures: [] }, ...prev])
      setForm({ name: '', code: '' }); setShowCreate(false)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Page title="My Classes" subtitle="Create and manage your classes" actions={<Btn onClick={() => setShowCreate(true)}>+ Create Class</Btn>}>
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading…</p> :
        classes.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>📚</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No classes yet</p>
            <Btn onClick={() => setShowCreate(true)}>Create Your First Class</Btn>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 16 }}>
            {classes.map(c => <ClassGridCard key={c.id} cls={c} onClick={() => setSelected(c)} />)}
          </div>
        )}
      {showCreate && (
        <Modal title="Create New Class" onClose={() => setShowCreate(false)}>
          <Input label="Class Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Data Structures & Algorithms" />
          <Input label="Class Code *" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS301" />
          <Btn onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create Class'}</Btn>
        </Modal>
      )}
    </Page>
  )
}

// ── Student Classes ───────────────────────────────────────────
function StudentClassDetail({ cls, onBack }) {
  return (
    <Page title={cls.name} subtitle={`${cls.code}${cls.profiles ? ' · By ' + cls.profiles.name : ''}`} actions={<Btn variant="secondary" onClick={onBack}>← Back</Btn>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
        <div>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>Lectures ({(cls.lectures || []).length})</h3>
          {(cls.lectures || []).length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '44px' }}><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No lectures uploaded yet</p></Card>
          ) : (cls.lectures || []).map(l => <LectureCard key={l.id} lecture={{ ...l, videoUrl: l.video_url }} />)}
        </div>
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>Class Info</h3>
          {cls.profiles && (
            <>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Instructor</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Avatar initials={cls.profiles.avatar || '?'} size={34} colorIndex={0} />
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{cls.profiles.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{cls.profiles.department}</p>
                </div>
              </div>
            </>
          )}
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Students Enrolled</p>
          <p style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: '0 0 16px' }}>{(cls.enrollments || []).length}</p>
        </Card>
      </div>
    </Page>
  )
}

function StudentClasses() {
  const { user } = useApp()
  const [allClasses, setAllClasses] = useState([])
  const [selected, setSelected]    = useState(null)
  const [loading, setLoading]      = useState(true)

  useEffect(() => {
    getAllClassesForStudent().then(d => { setAllClasses(d || []); setLoading(false) }).catch(e => { console.error(e); setLoading(false) })
  }, [])

  if (selected) return <StudentClassDetail cls={selected} onBack={() => setSelected(null)} />

  const enrolled  = allClasses.filter(c => (c.enrollments || []).some(e => e.student_id === user.id))
  const available = allClasses.filter(c => !(c.enrollments || []).some(e => e.student_id === user.id))

  async function handleJoin(classId) {
    try {
      await enrollStudent(classId, user.id)
      setAllClasses(prev => prev.map(c => c.id === classId ? { ...c, enrollments: [...(c.enrollments || []), { student_id: user.id }] } : c))
    } catch (e) { alert(e.message) }
  }

  return (
    <Page title="My Classes" subtitle="Access your enrolled classes and lectures">
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading…</p> : (
        <>
          {enrolled.length > 0 && (
            <>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Enrolled Classes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14, marginBottom: 28 }}>
                {enrolled.map(c => <ClassGridCard key={c.id} cls={c} teacher={c.profiles} enrolled onClick={() => setSelected(c)} />)}
              </div>
            </>
          )}
          {available.length > 0 && (
            <>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Available to Join</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
                {available.map(c => <ClassGridCard key={c.id} cls={c} teacher={c.profiles} onJoin={handleJoin} />)}
              </div>
            </>
          )}
          {enrolled.length === 0 && available.length === 0 && (
            <Card style={{ textAlign: 'center', padding: '60px' }}><p style={{ color: 'var(--text-muted)' }}>No classes available yet</p></Card>
          )}
        </>
      )}
    </Page>
  )
}

export default function Classes() {
  const { user } = useApp()
  return user.role === 'teacher' ? <TeacherClasses /> : <StudentClasses />
}
