import { useApp } from '../context/AppContext';
import Page from '../components/ui/Page';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// Shared attendance chart component
function AttendanceChart({ records, students, title }) {
  const dates = Object.keys(records).sort();
  if (dates.length === 0) return (
    <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No attendance records yet</p>
  );

  return (
    <div>
      <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
      {/* Day-wise bar chart */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80, marginBottom: 8 }}>
        {dates.map(date => {
          const dayRecord = records[date];
          const total   = students.length;
          const present = students.filter(s => dayRecord[s.id]).length;
          const pct     = total ? Math.round((present / total) * 100) : 0;
          return (
            <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{pct}%</span>
              <div style={{ width: '100%', height: 56, background: 'var(--border-dim)', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', height: `${pct}%`, background: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: 4, transition: 'height 0.3s' }} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{date.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Teacher Overview ─────────────────────────────────────────
function TeacherDashboard() {
  const { user, classes, quizzes, attendance, allUsers } = useApp();
  const myClasses     = classes.filter(c => c.teacherId === user.id);
  const myQuizzes     = quizzes.filter(q => q.teacherId === user.id);
  const totalStudents = new Set(myClasses.flatMap(c => c.students)).size;
  const totalLectures = myClasses.reduce((a, c) => a + c.lectures.length, 0);
  const students      = allUsers.filter(u => u.role === 'student');

  return (
    <Page
      title={`${getGreeting()}, ${user.name.split(' ')[0]} 👋`}
      subtitle={`${user.department} · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}`}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="My Classes"     value={myClasses.length}                                          icon="📚" />
        <StatCard label="Total Students" value={totalStudents}                                              icon="👥" />
        <StatCard label="Active Tests"   value={myQuizzes.filter(q => q.status === 'active').length}        icon="📝" />
        <StatCard label="Total Lectures" value={totalLectures}                                              icon="🎬" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Attendance overview per class */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
            ✅ Attendance Overview
          </h3>
          {myClasses.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No classes yet</p>
          ) : myClasses.map(cls => {
            const clsRecords  = attendance[cls.id] || {};
            const clsStudents = allUsers.filter(u => cls.students.includes(u.id));
            const dates       = Object.keys(clsRecords);
            const totalPresences = dates.reduce((acc, d) => acc + clsStudents.filter(s => clsRecords[d][s.id]).length, 0);
            const maxPresences   = dates.length * clsStudents.length;
            const overallPct     = maxPresences ? Math.round((totalPresences / maxPresences) * 100) : 0;

            return (
              <div key={cls.id} style={{ marginBottom: 16, padding: '14px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-dim)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cls.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{cls.code} · {clsStudents.length} students · {dates.length} sessions</p>
                  </div>
                  <span style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, color: overallPct >= 75 ? 'var(--success)' : overallPct >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{overallPct}%</span>
                </div>
                <AttendanceChart records={clsRecords} students={clsStudents} title="Day-wise attendance" />
              </div>
            );
          })}
        </Card>

        {/* My Classes quick view */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>📚 My Classes</h3>
          {myClasses.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No classes created yet.</p>
          ) : myClasses.map(c => (
            <div key={c.id} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-dim)' }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{c.code} · {c.students.length} students</p>
              </div>
              <Badge variant="default">{c.lectures.length} lectures</Badge>
            </div>
          ))}

          {/* Active tests */}
          {myQuizzes.filter(q => q.status === 'active').length > 0 && (
            <>
              <p style={{ margin: '16px 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Tests</p>
              {myQuizzes.filter(q => q.status === 'active').map(q => {
                const cls = classes.find(c => c.id === q.classId);
                const subCount = Object.keys(q.submissions || {}).length;
                return (
                  <div key={q.id} style={{ padding: '10px 14px', background: 'var(--warning-bg)', borderRadius: 9, marginBottom: 8, border: '1px solid var(--warning)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{q.title}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{cls?.name}</p>
                    </div>
                    <Badge variant="warning">{subCount} submitted</Badge>
                  </div>
                );
              })}
            </>
          )}
        </Card>
      </div>
    </Page>
  );
}

// ─── Student Overview ─────────────────────────────────────────
function StudentDashboard() {
  const { user, classes, quizzes, attendance, allUsers } = useApp();

  const myClasses       = classes.filter(c => c.students.includes(user.id));
  const activeQuizzes   = quizzes.filter(q => q.status === 'active' && myClasses.some(c => c.id === q.classId) && !q.submissions[user.id]);
  const upcomingQuizzes = quizzes.filter(q => q.status === 'upcoming' && myClasses.some(c => c.id === q.classId));
  const students        = allUsers.filter(u => u.role === 'student').sort((a, b) => (b.points || 0) - (a.points || 0));
  const myRank          = students.findIndex(s => s.id === user.id) + 1;

  // Compute attendance per class
  const attendanceByClass = myClasses.map(cls => {
    const records = attendance[cls.id] || {};
    const dates   = Object.keys(records);
    const present = dates.filter(d => records[d][user.id]).length;
    const pct     = dates.length ? Math.round((present / dates.length) * 100) : 0;
    return { cls, dates, present, pct, records };
  });

  const overallAttendance = (() => {
    let p = 0, t = 0;
    attendanceByClass.forEach(({ present, dates }) => { p += present; t += dates.length; });
    return t ? Math.round((p / t) * 100) : 0;
  })();

  return (
    <Page
      title={`${getGreeting()}, ${user.name.split(' ')[0]} 👋`}
      subtitle={`${user.department || 'Student'} · Roll No: ${user.rollNo || '—'}`}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="My Rank"          value={`#${myRank}`}              icon="🏆" />
        <StatCard label="Lectures Watched" value={user.lecturesWatched || 0} icon="🎬" />
        <StatCard label="Overall Attendance" value={`${overallAttendance}%`} icon="✅" />
        <StatCard label="Total Points"     value={user.points || 0}          icon="⭐" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Attendance breakdown */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>✅ My Attendance</h3>
          {attendanceByClass.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Enroll in classes to see attendance</p>
          ) : attendanceByClass.map(({ cls, dates, present, pct, records }) => (
            <div key={cls.id} style={{ marginBottom: 16, padding: '14px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-dim)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cls.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{present}/{dates.length} classes attended</p>
                </div>
                <span style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, color: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{pct}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--border-dim)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
              {/* Day dots */}
              {dates.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                  {Object.keys(records).sort().map(d => (
                    <div key={d} title={d} style={{ width: 10, height: 10, borderRadius: 2, background: records[d][user.id] ? 'var(--success)' : 'var(--danger)', opacity: 0.8 }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>

        {/* Pending tests + quick info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>🔥 Pending Tests</h3>
            {activeQuizzes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>No pending tests! 🎉</p>
            ) : activeQuizzes.map(q => {
              const cls = classes.find(c => c.id === q.classId);
              return (
                <div key={q.id} style={{ padding: '11px 14px', borderRadius: 10, marginBottom: 8, background: 'var(--danger-bg)', border: '1px solid var(--danger)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{q.title}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{cls?.name}</p>
                    </div>
                    <Badge variant="danger">Due {new Date(q.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</Badge>
                  </div>
                </div>
              );
            })}
            {upcomingQuizzes.length > 0 && (
              <>
                <p style={{ margin: '12px 0 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Upcoming</p>
                {upcomingQuizzes.map(q => (
                  <div key={q.id} style={{ padding: '9px 14px', background: 'var(--bg-elevated)', borderRadius: 9, marginBottom: 6, border: '1px solid var(--border-dim)' }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{q.title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>Opens {new Date(q.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                  </div>
                ))}
              </>
            )}
          </Card>

          {/* Rank card */}
          <Card style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Department Rank</p>
            <p style={{ margin: '0 0 4px', fontSize: 44, fontFamily: 'var(--font-display)', color: 'var(--accent-text)', lineHeight: 1 }}>#{myRank}</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{user.points || 0} points total</p>
          </Card>
        </div>
      </div>
    </Page>
  );
}

export default function Dashboard() {
  const { user } = useApp();
  return user.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
}
