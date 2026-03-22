import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Page from '../components/ui/Page';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Btn from '../components/ui/Btn';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import LectureCard from '../components/LectureCard';

// ─── Shared class grid card ──────────────────────────────────
function ClassGridCard({ cls, teacher, enrolled, onClick, onJoin }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#1a1d2e',
        border: `1px solid ${hovered ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 16,
        padding: '22px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <Badge>{cls.code}</Badge>
        {enrolled && (
          <Badge color="rgba(16,185,129,0.15)" textColor="#34d399">
            Enrolled
          </Badge>
        )}
      </div>
      <h3 style={{ margin: '0 0 5px', fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>
        {cls.name}
      </h3>
      {teacher && (
        <p style={{ margin: '0 0 14px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          {teacher.name}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge color="rgba(16,185,129,0.1)" textColor="#34d399">
            {cls.lectures.length} lectures
          </Badge>
          <Badge color="rgba(255,255,255,0.06)" textColor="rgba(255,255,255,0.5)">
            {cls.students.length} students
          </Badge>
        </div>
        {onJoin && (
          <Btn
            small
            onClick={(e) => {
              e.stopPropagation();
              onJoin(cls.id);
            }}
          >
            Join
          </Btn>
        )}
      </div>
    </div>
  );
}

// ─── Teacher: class detail ───────────────────────────────────
function TeacherClassDetail({ cls, onBack }) {
  const { classes, setClasses, allUsers } = useApp();
  const [showUpload, setShowUpload] = useState(false);
  const [lecture, setLecture]       = useState({ title: '', duration: '', videoUrl: '' });

  const liveCls   = classes.find((c) => c.id === cls.id) || cls;
  const students  = allUsers.filter((u) => u.role === 'student');

  function addLecture() {
    if (!lecture.title) return;
    const lec = {
      id: 'l' + Date.now(),
      title:    lecture.title,
      duration: lecture.duration || '—',
      date:     new Date().toISOString().slice(0, 10),
      videoUrl: lecture.videoUrl || '',
    };
    setClasses((prev) =>
      prev.map((c) => (c.id === liveCls.id ? { ...c, lectures: [...c.lectures, lec] } : c)),
    );
    setLecture({ title: '', duration: '', videoUrl: '' });
    setShowUpload(false);
  }

  function toggleStudent(studentId) {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== liveCls.id) return c;
        const inClass = c.students.includes(studentId);
        return {
          ...c,
          students: inClass
            ? c.students.filter((s) => s !== studentId)
            : [...c.students, studentId],
        };
      }),
    );
  }

  return (
    <Page
      title={liveCls.name}
      subtitle={`${liveCls.code} · ${liveCls.students.length} students enrolled`}
      actions={
        <>
          <Btn variant="secondary" onClick={onBack}>← Back</Btn>
          <Btn onClick={() => setShowUpload(true)}>+ Upload Lecture</Btn>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Lectures */}
        <div>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#f1f5f9' }}>
            Video Lectures ({liveCls.lectures.length})
          </h3>
          {liveCls.lectures.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '44px' }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>🎬</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 16, fontSize: 14 }}>
                No lectures yet
              </p>
              <Btn onClick={() => setShowUpload(true)}>Upload First Lecture</Btn>
            </Card>
          ) : (
            liveCls.lectures.map((l) => <LectureCard key={l.id} lecture={l} />)
          )}
        </div>

        {/* Students panel */}
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#f1f5f9' }}>
            Students ({students.length})
          </h3>
          {students.map((s, i) => {
            const enrolled = liveCls.students.includes(s.id);
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <Avatar initials={s.avatar} size={30} colorIndex={i} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: '#e2e8f0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    {s.rollNo}
                  </p>
                </div>
                <button
                  onClick={() => toggleStudent(s.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 7,
                    border: `1px solid ${enrolled ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    background: enrolled ? 'rgba(16,185,129,0.1)' : 'transparent',
                    color: enrolled ? '#34d399' : 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {enrolled ? '✓ Enrolled' : '+ Add'}
                </button>
              </div>
            );
          })}
        </Card>
      </div>

      {showUpload && (
        <Modal title="Upload Lecture" onClose={() => setShowUpload(false)}>
          <Input
            label="Lecture Title *"
            value={lecture.title}
            onChange={(e) => setLecture({ ...lecture, title: e.target.value })}
            placeholder="e.g. Introduction to Arrays"
          />
          <Input
            label="Duration"
            value={lecture.duration}
            onChange={(e) => setLecture({ ...lecture, duration: e.target.value })}
            placeholder="e.g. 45 min"
          />
          <Input
            label="YouTube Embed URL"
            value={lecture.videoUrl}
            onChange={(e) => setLecture({ ...lecture, videoUrl: e.target.value })}
            placeholder="https://www.youtube.com/embed/VIDEO_ID"
          />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '-4px 0 16px' }}>
            Use the embed URL format: youtube.com/embed/VIDEO_ID
          </p>
          <Btn onClick={addLecture}>Upload Lecture</Btn>
        </Modal>
      )}
    </Page>
  );
}

// ─── Teacher: classes list ───────────────────────────────────
function TeacherClasses() {
  const { user, classes, setClasses, allUsers } = useApp();
  const [selected, setSelected]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]           = useState({ name: '', code: '' });

  const myClasses = classes.filter((c) => c.teacherId === user.id);

  if (selected) {
    return <TeacherClassDetail cls={selected} onBack={() => setSelected(null)} />;
  }

  function createClass() {
    if (!form.name || !form.code) return;
    const nc = {
      id:        'c' + Date.now(),
      name:      form.name,
      code:      form.code,
      teacherId: user.id,
      students:  [],
      lectures:  [],
    };
    setClasses((prev) => [...prev, nc]);
    setForm({ name: '', code: '' });
    setShowCreate(false);
  }

  return (
    <Page
      title="My Classes"
      subtitle="Create and manage your classes"
      actions={<Btn onClick={() => setShowCreate(true)}>+ Create Class</Btn>}
    >
      {myClasses.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ fontSize: 40, marginBottom: 8 }}>📚</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
            No classes yet
          </p>
          <Btn onClick={() => setShowCreate(true)}>Create Your First Class</Btn>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))',
            gap: 16,
          }}
        >
          {myClasses.map((c) => (
            <ClassGridCard
              key={c.id}
              cls={c}
              onClick={() => setSelected(c)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Create New Class" onClose={() => setShowCreate(false)}>
          <Input
            label="Class Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Data Structures & Algorithms"
          />
          <Input
            label="Class Code *"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. CS301"
          />
          <Btn onClick={createClass}>Create Class</Btn>
        </Modal>
      )}
    </Page>
  );
}

// ─── Student: class detail ───────────────────────────────────
function StudentClassDetail({ cls, onBack }) {
  const { classes, allUsers } = useApp();
  const liveCls = classes.find((c) => c.id === cls.id) || cls;
  const teacher = allUsers.find((u) => u.id === liveCls.teacherId);

  return (
    <Page
      title={liveCls.name}
      subtitle={`${liveCls.code} · ${teacher ? 'By ' + teacher.name : ''}`}
      actions={<Btn variant="secondary" onClick={onBack}>← Back</Btn>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
        <div>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#f1f5f9' }}>
            Lectures ({liveCls.lectures.length})
          </h3>
          {liveCls.lectures.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '44px' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                No lectures uploaded yet
              </p>
            </Card>
          ) : (
            liveCls.lectures.map((l) => <LectureCard key={l.id} lecture={l} />)
          )}
        </div>

        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#f1f5f9' }}>
            Class Info
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 8px' }}>
            Instructor
          </p>
          {teacher && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20,
              }}
            >
              <Avatar initials={teacher.avatar} size={34} colorIndex={0} />
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>
                  {teacher.name}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                  {teacher.department}
                </p>
              </div>
            </div>
          )}
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>
            Students Enrolled
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 16px' }}>
            {liveCls.students.length}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>
            Total Lectures
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            {liveCls.lectures.length}
          </p>
        </Card>
      </div>
    </Page>
  );
}

// ─── Student: classes list ───────────────────────────────────
function StudentClasses() {
  const { user, classes, setClasses, allUsers } = useApp();
  const [selected, setSelected] = useState(null);

  const enrolled  = classes.filter((c) => c.students.includes(user.id));
  const available = classes.filter((c) => !c.students.includes(user.id));

  if (selected) {
    return <StudentClassDetail cls={selected} onBack={() => setSelected(null)} />;
  }

  function joinClass(classId) {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, students: [...c.students, user.id] } : c,
      ),
    );
  }

  return (
    <Page title="My Classes" subtitle="Access your enrolled classes and lectures">
      {enrolled.length > 0 && (
        <>
          <SectionHeading>Enrolled Classes</SectionHeading>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))',
              gap: 14,
              marginBottom: 28,
            }}
          >
            {enrolled.map((c) => (
              <ClassGridCard
                key={c.id}
                cls={c}
                teacher={allUsers.find((u) => u.id === c.teacherId)}
                enrolled
                onClick={() => setSelected(c)}
              />
            ))}
          </div>
        </>
      )}

      {available.length > 0 && (
        <>
          <SectionHeading>Available to Join</SectionHeading>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))',
              gap: 14,
            }}
          >
            {available.map((c) => (
              <ClassGridCard
                key={c.id}
                cls={c}
                teacher={allUsers.find((u) => u.id === c.teacherId)}
                onJoin={joinClass}
              />
            ))}
          </div>
        </>
      )}

      {enrolled.length === 0 && available.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)' }}>No classes available</p>
        </Card>
      )}
    </Page>
  );
}

function SectionHeading({ children }) {
  return (
    <h3
      style={{
        margin: '0 0 14px',
        fontSize: 15,
        fontWeight: 600,
        color: '#f1f5f9',
      }}
    >
      {children}
    </h3>
  );
}

export default function Classes() {
  const { user } = useApp();
  return user.role === 'teacher' ? <TeacherClasses /> : <StudentClasses />;
}
