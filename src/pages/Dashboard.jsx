import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Page from '../components/ui/Page';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { TIMETABLE, DAYS } from '../data/mockData';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function TimetableCard({ userId }) {
  const [offset, setOffset] = useState(0);
  const target = new Date();
  target.setDate(target.getDate() + offset);
  const dayName = DAYS[target.getDay()];
  const schedule = (TIMETABLE[userId] || TIMETABLE['s1'])[dayName] || [];

  const label =
    offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : offset === -1 ? 'Yesterday' : dayName;

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
          📅 Timetable
        </h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <NavBtn onClick={() => setOffset((d) => d - 1)}>‹</NavBtn>
          <span
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
              minWidth: 72,
              textAlign: 'center',
            }}
          >
            {label}
          </span>
          <NavBtn onClick={() => setOffset((d) => d + 1)}>›</NavBtn>
        </div>
      </div>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
        {dayName} ·{' '}
        {target.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
      </p>
      {schedule.length === 0 ? (
        <p
          style={{
            color: 'rgba(255,255,255,0.25)',
            fontSize: 13,
            textAlign: 'center',
            padding: '20px 0',
          }}
        >
          No classes scheduled
        </p>
      ) : (
        schedule.map((s, i) => (
          <div
            key={i}
            style={{
              padding: '9px 12px',
              background: 'rgba(99,102,241,0.08)',
              borderRadius: 9,
              marginBottom: 7,
              borderLeft: '3px solid #6366f1',
              fontSize: 13,
              color: '#e2e8f0',
            }}
          >
            {s}
          </div>
        ))
      )}
    </Card>
  );
}

function NavBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: 'none',
        color: '#e2e8f0',
        borderRadius: 7,
        width: 28,
        height: 28,
        cursor: 'pointer',
        fontSize: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

// ─── Teacher Dashboard ───────────────────────────────────────
function TeacherDashboard() {
  const { user, classes, quizzes } = useApp();
  const myClasses = classes.filter((c) => c.teacherId === user.id);
  const myQuizzes = quizzes.filter((q) => q.teacherId === user.id);
  const totalStudents = new Set(myClasses.flatMap((c) => c.students)).size;
  const totalLectures = myClasses.reduce((a, c) => a + c.lectures.length, 0);

  return (
    <Page
      title={`${getGreeting()}, ${user.name.split(' ')[0]} 👋`}
      subtitle={`${user.department} · ${new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })}`}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard label="My Classes"     value={myClasses.length}                                   icon="📚" color="#6366f1" />
        <StatCard label="Total Students" value={totalStudents}                                       icon="👥" color="#0891b2" />
        <StatCard label="Active Quizzes" value={myQuizzes.filter((q) => q.status === 'active').length} icon="📝" color="#d97706" />
        <StatCard label="Total Lectures" value={totalLectures}                                       icon="🎬" color="#059669" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <TimetableCard userId={user.id} />

        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
            📚 My Classes
          </h3>
          {myClasses.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              No classes created yet.
            </p>
          ) : (
            myClasses.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 10,
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>
                    {c.name}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {c.code} · {c.students.length} students
                  </p>
                </div>
                <Badge>{c.lectures.length} lectures</Badge>
              </div>
            ))
          )}
        </Card>
      </div>
    </Page>
  );
}

// ─── Student Dashboard ───────────────────────────────────────
function StudentDashboard() {
  const { user, classes, quizzes, attendance, allUsers } = useApp();

  const myClasses    = classes.filter((c) => c.students.includes(user.id));
  const activeQuizzes  = quizzes.filter(
    (q) =>
      q.status === 'active' &&
      myClasses.some((c) => c.id === q.classId) &&
      !q.submissions[user.id],
  );
  const upcomingQuizzes = quizzes.filter(
    (q) =>
      q.status === 'upcoming' && myClasses.some((c) => c.id === q.classId),
  );

  const students  = allUsers.filter((u) => u.role === 'student').sort((a, b) => (b.points || 0) - (a.points || 0));
  const myRank    = students.findIndex((s) => s.id === user.id) + 1;

  let present = 0, total = 0;
  Object.values(attendance).forEach((dateMap) =>
    Object.values(dateMap).forEach((day) => {
      total++;
      if (day[user.id]) present++;
    }),
  );
  const attendancePct = total ? Math.round((present / total) * 100) : 0;

  return (
    <Page
      title={`${getGreeting()}, ${user.name.split(' ')[0]} 👋`}
      subtitle={`${user.department || 'Student'} · Roll No: ${user.rollNo || '—'}`}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard label="My Rank"          value={`#${myRank}`}              icon="🏆" color="#d97706" />
        <StatCard label="Lectures Watched" value={user.lecturesWatched || 0} icon="🎬" color="#6366f1" />
        <StatCard label="Attendance"       value={`${attendancePct}%`}       icon="✅" color="#059669" />
        <StatCard label="Total Points"     value={user.points || 0}          icon="⭐" color="#db2777" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Pending quizzes */}
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
            🔥 Pending Quizzes
          </h3>
          {activeQuizzes.length === 0 ? (
            <p
              style={{
                color: 'rgba(255,255,255,0.25)',
                fontSize: 13,
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              No pending quizzes! 🎉
            </p>
          ) : (
            activeQuizzes.map((q) => {
              const cls = classes.find((c) => c.id === q.classId);
              return (
                <div
                  key={q.id}
                  style={{
                    padding: '12px',
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 10,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>
                        {q.title}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        {cls?.name}
                      </p>
                    </div>
                    <Badge color="rgba(239,68,68,0.15)" textColor="#f87171">
                      Due{' '}
                      {new Date(q.deadline).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
          {upcomingQuizzes.length > 0 && (
            <>
              <p
                style={{
                  margin: '14px 0 8px',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Upcoming
              </p>
              {upcomingQuizzes.map((q) => (
                <div
                  key={q.id}
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 9,
                    marginBottom: 6,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0' }}>{q.title}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    Opens{' '}
                    {new Date(q.deadline).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </>
          )}
        </Card>

        <TimetableCard userId={user.id} />
      </div>
    </Page>
  );
}

export default function Dashboard() {
  const { user } = useApp();
  return user.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
}
