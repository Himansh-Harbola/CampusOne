import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Page from '../components/ui/Page';
import Card from '../components/ui/Card';
import Btn from '../components/ui/Btn';
import Avatar from '../components/ui/Avatar';

const today = new Date().toISOString().slice(0, 10);

function CameraBox({ scanning, progress, detectedIds, done }) {
  return (
    <div style={{ background: '#0a0a0f', borderRadius: 12, aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-dim)', marginBottom: 16 }}>
      {done ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 52, marginBottom: 8 }}>✅</p>
          <p style={{ color: '#34d399', fontSize: 15, fontWeight: 600 }}>Attendance Recorded!</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Face verification complete</p>
        </div>
      ) : scanning ? (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'rgba(16,185,129,0.8)', top: `${progress}%`, transition: 'top 0.08s linear' }} />
          {[{ top: 16, left: 16 }, { top: 16, right: 16 }, { bottom: 16, left: 16 }, { bottom: 16, right: 16 }].map((pos, i) => (
            <div key={i} style={{ position: 'absolute', width: 22, height: 22, ...pos, borderTop: pos.top !== undefined ? '2px solid #10b981' : undefined, borderBottom: pos.bottom !== undefined ? '2px solid #10b981' : undefined, borderLeft: pos.left !== undefined ? '2px solid #10b981' : undefined, borderRight: pos.right !== undefined ? '2px solid #10b981' : undefined }} />
          ))}
          {detectedIds.map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: 54, height: 64, border: '2px solid #10b981', borderRadius: 4, left: `${18 + i * 20}%`, top: '22%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            </div>
          ))}
          <p style={{ position: 'absolute', bottom: 14, color: '#10b981', fontSize: 13 }}>Scanning… {progress}% {detectedIds.length > 0 && `· ${detectedIds.length} detected`}</p>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 44, marginBottom: 8 }}>📷</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Camera feed will appear here</p>
        </div>
      )}
    </div>
  );
}

function TeacherAttendance() {
  const { user, classes, attendance, setAttendance, allUsers } = useApp();
  const myClasses = classes.filter(c => c.teacherId === user.id);
  const [selectedCid, setSelectedCid] = useState(myClasses[0]?.id || '');
  const [scanning, setScanning]       = useState(false);
  const [progress, setProgress]       = useState(0);
  const [detectedIds, setDetectedIds] = useState([]);
  const [manualPresent, setManualPresent] = useState({});
  const [saved, setSaved]             = useState(false);

  const cls      = classes.find(c => c.id === selectedCid);
  const students = cls ? allUsers.filter(u => cls.students.includes(u.id)) : [];
  const scanDone = !scanning && Object.keys(manualPresent).length > 0;

  function startScan() {
    setScanning(true); setProgress(0); setDetectedIds([]); setSaved(false);
    const identified = []; let p = 0;
    const interval = setInterval(() => {
      p += 3; setProgress(Math.min(p, 100));
      [28, 52, 72, 88].forEach((t, i) => { if (p === t && students[i]) { identified.push(students[i].id); setDetectedIds([...identified]); } });
      if (p >= 100) {
        clearInterval(interval);
        const record = {}; students.forEach(s => { record[s.id] = identified.includes(s.id); });
        setManualPresent(record); setScanning(false);
      }
    }, 55);
  }

  function saveAttendance() {
    setAttendance(prev => ({ ...prev, [selectedCid]: { ...(prev[selectedCid] || {}), [today]: manualPresent } }));
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  const todayRecord = (attendance[selectedCid] || {})[today] || {};

  return (
    <Page title="Attendance" subtitle="AI face recognition powered attendance system">
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {myClasses.map(c => (
          <button key={c.id} onClick={() => { setSelectedCid(c.id); setManualPresent({}); setSaved(false); }} style={{
            padding: '8px 16px', borderRadius: 9,
            border: `1px solid ${selectedCid === c.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
            background: selectedCid === c.id ? 'var(--accent-light)' : 'var(--bg-surface)',
            color: selectedCid === c.id ? 'var(--accent-text)' : 'var(--text-secondary)',
            fontSize: 13, cursor: 'pointer', fontWeight: selectedCid === c.id ? 600 : 400,
            fontFamily: 'var(--font-body)',
          }}>{c.code} — {c.name}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>🤖 Face Recognition Scanner</h3>
          <CameraBox scanning={scanning} progress={progress} detectedIds={detectedIds} done={scanDone} />
          {scanning && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ height: 5, background: 'var(--border-dim)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--success)', borderRadius: 3, transition: 'width 0.08s' }} />
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={startScan} disabled={scanning}>{scanning ? '🔄 Scanning…' : '📷 Start Face Scan'}</Btn>
            {Object.keys(manualPresent).length > 0 && <Btn variant="success" onClick={saveAttendance}>{saved ? '✓ Saved!' : 'Save Attendance'}</Btn>}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>Students</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{today}</span>
          </div>
          {students.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No students enrolled</p>
          ) : students.map((s, i) => {
            const present = Object.keys(manualPresent).length > 0 ? manualPresent[s.id] : todayRecord[s.id];
            const scanned = detectedIds.includes(s.id);
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <Avatar initials={s.avatar} size={30} colorIndex={i} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{s.rollNo}</p>
                </div>
                {scanned && <span style={{ fontSize: 11, color: 'var(--success)', flexShrink: 0 }}>🔍</span>}
                <button onClick={() => setManualPresent(prev => ({ ...prev, [s.id]: !prev[s.id] }))} style={{
                  padding: '4px 10px', borderRadius: 7,
                  border: `1px solid ${present ? 'var(--success)' : 'var(--danger)'}`,
                  background: present ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: present ? 'var(--success)' : 'var(--danger)',
                  fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)',
                }}>{present ? 'Present' : 'Absent'}</button>
              </div>
            );
          })}
        </Card>
      </div>

      {Object.keys(attendance[selectedCid] || {}).length > 0 && (
        <Card style={{ marginTop: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>📅 Historical Records</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student</th>
                  {Object.keys(attendance[selectedCid]).map(date => (
                    <th key={date} style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{date.slice(5)}</th>
                  ))}
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>%</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const dates   = Object.keys(attendance[selectedCid]);
                  const present = dates.filter(d => attendance[selectedCid][d][s.id]).length;
                  const pct     = Math.round((present / dates.length) * 100);
                  return (
                    <tr key={s.id}>
                      <td style={{ padding: '8px 0', color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</td>
                      {dates.map(d => <td key={d} style={{ textAlign: 'center', padding: '8px 12px' }}>{attendance[selectedCid][d][s.id] ? '✅' : '❌'}</td>)}
                      <td style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, fontFamily: 'var(--font-display)', color: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Page>
  );
}

function StudentAttendance() {
  const { user, classes, attendance, setAttendance } = useApp();
  const myClasses = classes.filter(c => c.students.includes(user.id));
  const [selectedCid, setSelectedCid] = useState(myClasses[0]?.id || '');
  const [scanning, setScanning]       = useState(false);
  const [progress, setProgress]       = useState(0);
  const [done, setDone]               = useState(false);

  function markAttendance() {
    setScanning(true); setProgress(0); setDone(false);
    let p = 0;
    const interval = setInterval(() => {
      p += 5; setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(interval); setScanning(false); setDone(true);
        setAttendance(prev => ({ ...prev, [selectedCid]: { ...(prev[selectedCid] || {}), [today]: { ...((prev[selectedCid] || {})[today] || {}), [user.id]: true } } }));
      }
    }, 50);
  }

  return (
    <Page title="Attendance" subtitle="Mark your attendance using face recognition">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>📷 Face Scan Check-in</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select Class</label>
            <select value={selectedCid} onChange={e => { setSelectedCid(e.target.value); setDone(false); }} style={{ padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', width: '100%', maxWidth: 320, fontFamily: 'var(--font-body)' }}>
              {myClasses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div style={{ background: '#0a0a0f', borderRadius: 12, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-dim)', marginBottom: 16 }}>
            {done ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 52, marginBottom: 8 }}>✅</p>
                <p style={{ color: '#34d399', fontSize: 15, fontWeight: 600 }}>Attendance Marked!</p>
              </div>
            ) : scanning ? (
              <>
                <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'rgba(16,185,129,0.8)', top: `${progress}%`, transition: 'top 0.05s linear' }} />
                <div style={{ width: 110, height: 140, border: '2px solid #10b981', borderRadius: '50%', position: 'relative', zIndex: 1 }} />
                <p style={{ position: 'absolute', bottom: 14, color: '#10b981', fontSize: 13 }}>Verifying identity… {progress}%</p>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 44, marginBottom: 8 }}>👤</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Position your face in the frame</p>
              </div>
            )}
          </div>
          {!done && <Btn onClick={markAttendance} disabled={scanning}>{scanning ? 'Scanning…' : '📷 Mark My Attendance'}</Btn>}
        </Card>

        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>My Attendance</h3>
          {myClasses.map(c => {
            const records = attendance[c.id] || {};
            const dates   = Object.keys(records);
            const present = dates.filter(d => records[d][user.id]).length;
            const pct     = dates.length ? Math.round((present / dates.length) * 100) : 0;
            return (
              <div key={c.id} style={{ marginBottom: 16, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-dim)' }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <div style={{ flex: 1, height: 5, background: 'var(--border-dim)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', color: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{present}/{dates.length} classes attended</p>
              </div>
            );
          })}
          {myClasses.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Enroll in classes to see attendance</p>}
        </Card>
      </div>
    </Page>
  );
}

export default function Attendance() {
  const { user } = useApp();
  return user.role === 'teacher' ? <TeacherAttendance /> : <StudentAttendance />;
}
