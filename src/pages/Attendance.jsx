import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Page from '../components/ui/Page';
import Card from '../components/ui/Card';
import Btn from '../components/ui/Btn';
import Avatar from '../components/ui/Avatar';

const today = new Date().toISOString().slice(0, 10);

// ─── Shared: face scan camera box ───────────────────────────
function CameraBox({ scanning, progress, detectedIds, done, studentCount }) {
  return (
    <div
      style={{
        background: '#070a10',
        borderRadius: 12,
        aspectRatio: '16/9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        marginBottom: 16,
      }}
    >
      {done ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 56, marginBottom: 8 }}>✅</p>
          <p style={{ color: '#34d399', fontSize: 16, fontWeight: 600 }}>
            Attendance Recorded!
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
            Face verification complete
          </p>
        </div>
      ) : scanning ? (
        <>
          <div style={{ position: 'absolute', inset: 0, background: '#070a10' }} />
          {/* Animated scan line */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 2,
              background: 'rgba(16,185,129,0.8)',
              boxShadow: '0 0 12px rgba(16,185,129,0.5)',
              top: `${progress}%`,
              transition: 'top 0.08s linear',
            }}
          />
          {/* Corner brackets */}
          {[
            { top: 16, left: 16,  borderTop: '2px solid #10b981', borderLeft: '2px solid #10b981'  },
            { top: 16, right: 16, borderTop: '2px solid #10b981', borderRight: '2px solid #10b981' },
            { bottom: 16, left: 16,  borderBottom: '2px solid #10b981', borderLeft: '2px solid #10b981'  },
            { bottom: 16, right: 16, borderBottom: '2px solid #10b981', borderRight: '2px solid #10b981' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 22, height: 22, ...s }} />
          ))}
          {/* Detected face boxes */}
          {detectedIds.map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 54,
                height: 64,
                border: '2px solid #10b981',
                borderRadius: 4,
                left: `${18 + i * 20}%`,
                top: '22%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
            </div>
          ))}
          <p
            style={{
              position: 'absolute',
              bottom: 14,
              color: '#10b981',
              fontSize: 13,
              zIndex: 1,
            }}
          >
            Scanning… {progress}%
            {detectedIds.length > 0 && ` · ${detectedIds.length} detected`}
          </p>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 44, marginBottom: 8 }}>📷</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            Camera feed will appear here
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Teacher attendance ──────────────────────────────────────
function TeacherAttendance() {
  const { user, classes, attendance, setAttendance, allUsers } = useApp();

  const myClasses = classes.filter((c) => c.teacherId === user.id);
  const [selectedCid, setSelectedCid]   = useState(myClasses[0]?.id || '');
  const [scanning, setScanning]         = useState(false);
  const [progress, setProgress]         = useState(0);
  const [detectedIds, setDetectedIds]   = useState([]);
  const [manualPresent, setManualPresent] = useState({});
  const [saved, setSaved]               = useState(false);

  const cls      = classes.find((c) => c.id === selectedCid);
  const students = cls ? allUsers.filter((u) => cls.students.includes(u.id)) : [];
  const scanDone = !scanning && Object.keys(manualPresent).length > 0;

  function startScan() {
    setScanning(true);
    setProgress(0);
    setDetectedIds([]);
    setSaved(false);

    const identified = [];
    let p = 0;
    const interval = setInterval(() => {
      p += 3;
      setProgress(Math.min(p, 100));

      const thresholds = [28, 52, 72, 88];
      thresholds.forEach((t, i) => {
        if (p === t && students[i]) {
          identified.push(students[i].id);
          setDetectedIds([...identified]);
        }
      });

      if (p >= 100) {
        clearInterval(interval);
        const record = {};
        students.forEach((s) => { record[s.id] = identified.includes(s.id); });
        setManualPresent(record);
        setScanning(false);
      }
    }, 55);
  }

  function saveAttendance() {
    setAttendance((prev) => ({
      ...prev,
      [selectedCid]: {
        ...(prev[selectedCid] || {}),
        [today]: manualPresent,
      },
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const todayRecord = (attendance[selectedCid] || {})[today] || {};

  return (
    <Page title="Attendance" subtitle="AI face recognition powered attendance system">
      {/* Class tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {myClasses.map((c) => (
          <button
            key={c.id}
            onClick={() => { setSelectedCid(c.id); setManualPresent({}); setSaved(false); }}
            style={{
              padding: '8px 16px',
              borderRadius: 9,
              border: `1px solid ${selectedCid === c.id ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
              background: selectedCid === c.id ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: selectedCid === c.id ? '#a5b4fc' : 'rgba(255,255,255,0.45)',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: selectedCid === c.id ? 600 : 400,
            }}
          >
            {c.code} — {c.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Camera panel */}
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
            🤖 Face Recognition Scanner
          </h3>
          <CameraBox
            scanning={scanning}
            progress={progress}
            detectedIds={detectedIds}
            done={scanDone}
            studentCount={students.length}
          />

          {/* Progress bar */}
          {scanning && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  height: 5,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    borderRadius: 3,
                    transition: 'width 0.08s',
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={startScan} disabled={scanning}>
              {scanning ? '🔄 Scanning…' : '📷 Start Face Scan'}
            </Btn>
            {Object.keys(manualPresent).length > 0 && (
              <Btn variant="success" onClick={saveAttendance}>
                {saved ? '✓ Saved!' : 'Save Attendance'}
              </Btn>
            )}
          </div>
        </Card>

        {/* Student list */}
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: '#f1f5f9' }}>Students</h3>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{today}</span>
          </div>
          {students.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              No students enrolled
            </p>
          ) : (
            students.map((s, i) => {
              const present =
                Object.keys(manualPresent).length > 0
                  ? manualPresent[s.id]
                  : todayRecord[s.id];
              const scanned = detectedIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Avatar initials={s.avatar} size={30} colorIndex={i} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0' }}>{s.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                      {s.rollNo}
                    </p>
                  </div>
                  {scanned && (
                    <span style={{ fontSize: 11, color: '#10b981', flexShrink: 0 }}>
                      🔍
                    </span>
                  )}
                  <button
                    onClick={() =>
                      setManualPresent((prev) => ({ ...prev, [s.id]: !prev[s.id] }))
                    }
                    style={{
                      padding: '4px 10px',
                      borderRadius: 7,
                      border: `1px solid ${present ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.3)'}`,
                      background: present ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.07)',
                      color: present ? '#34d399' : '#f87171',
                      fontSize: 11,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {present ? 'Present' : 'Absent'}
                  </button>
                </div>
              );
            })
          )}
        </Card>
      </div>

      {/* Historical records */}
      {Object.keys(attendance[selectedCid] || {}).length > 0 && (
        <Card style={{ marginTop: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#f1f5f9' }}>
            📅 Historical Records
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px 0',
                      color: 'rgba(255,255,255,0.4)',
                      fontWeight: 500,
                    }}
                  >
                    Student
                  </th>
                  {Object.keys(attendance[selectedCid]).map((date) => (
                    <th
                      key={date}
                      style={{
                        textAlign: 'center',
                        padding: '8px 12px',
                        color: 'rgba(255,255,255,0.4)',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        fontSize: 12,
                      }}
                    >
                      {date.slice(5)}
                    </th>
                  ))}
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '8px 12px',
                      color: 'rgba(255,255,255,0.4)',
                      fontWeight: 500,
                    }}
                  >
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const dates  = Object.keys(attendance[selectedCid]);
                  const present = dates.filter((d) => attendance[selectedCid][d][s.id]).length;
                  const pct    = Math.round((present / dates.length) * 100);
                  return (
                    <tr key={s.id}>
                      <td style={{ padding: '8px 0', color: '#e2e8f0' }}>{s.name}</td>
                      {dates.map((d) => (
                        <td key={d} style={{ textAlign: 'center', padding: '8px 12px' }}>
                          {attendance[selectedCid][d][s.id] ? '✅' : '❌'}
                        </td>
                      ))}
                      <td
                        style={{
                          textAlign: 'center',
                          padding: '8px 12px',
                          fontWeight: 600,
                          color: pct >= 75 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171',
                        }}
                      >
                        {pct}%
                      </td>
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

// ─── Student attendance ──────────────────────────────────────
function StudentAttendance() {
  const { user, classes, attendance, setAttendance } = useApp();

  const myClasses = classes.filter((c) => c.students.includes(user.id));
  const [selectedCid, setSelectedCid] = useState(myClasses[0]?.id || '');
  const [scanning, setScanning]       = useState(false);
  const [progress, setProgress]       = useState(0);
  const [done, setDone]               = useState(false);

  function markAttendance() {
    setScanning(true);
    setProgress(0);
    setDone(false);
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(interval);
        setScanning(false);
        setDone(true);
        setAttendance((prev) => ({
          ...prev,
          [selectedCid]: {
            ...(prev[selectedCid] || {}),
            [today]: {
              ...((prev[selectedCid] || {})[today] || {}),
              [user.id]: true,
            },
          },
        }));
      }
    }, 50);
  }

  return (
    <Page title="Attendance" subtitle="Mark your attendance using face recognition">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
            📷 Face Scan Check-in
          </h3>

          {/* Class selector */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 6,
              }}
            >
              Select Class
            </label>
            <select
              value={selectedCid}
              onChange={(e) => { setSelectedCid(e.target.value); setDone(false); }}
              style={{
                padding: '10px 12px',
                borderRadius: 9,
                border: '1px solid rgba(255,255,255,0.12)',
                background: '#0f1117',
                color: '#e2e8f0',
                fontSize: 14,
                outline: 'none',
                width: '100%',
                maxWidth: 320,
                fontFamily: 'inherit',
              }}
            >
              {myClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Camera */}
          <div
            style={{
              background: '#070a10',
              borderRadius: 12,
              height: 260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.07)',
              marginBottom: 16,
            }}
          >
            {done ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 52, marginBottom: 8 }}>✅</p>
                <p style={{ color: '#34d399', fontSize: 15, fontWeight: 600 }}>
                  Attendance Marked!
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
                  Identity verified successfully
                </p>
              </div>
            ) : scanning ? (
              <>
                <div style={{ position: 'absolute', inset: 0, background: '#070a10' }} />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 2,
                    background: 'rgba(16,185,129,0.8)',
                    top: `${progress}%`,
                    transition: 'top 0.05s linear',
                  }}
                />
                {/* Face oval outline */}
                <div
                  style={{
                    width: 110,
                    height: 140,
                    border: '2px solid #10b981',
                    borderRadius: '50%',
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: '0 0 20px rgba(16,185,129,0.2)',
                  }}
                />
                <p
                  style={{
                    position: 'absolute',
                    bottom: 14,
                    color: '#10b981',
                    fontSize: 13,
                  }}
                >
                  Verifying identity… {progress}%
                </p>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 44, marginBottom: 8 }}>👤</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  Position your face in the frame
                </p>
              </div>
            )}
          </div>

          {!done && (
            <Btn onClick={markAttendance} disabled={scanning}>
              {scanning ? 'Scanning…' : '📷 Mark My Attendance'}
            </Btn>
          )}
        </Card>

        {/* Summary */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#f1f5f9' }}>
            My Attendance
          </h3>
          {myClasses.map((c) => {
            const records = attendance[c.id] || {};
            const dates   = Object.keys(records);
            const present = dates.filter((d) => records[d][user.id]).length;
            const pct     = dates.length ? Math.round((present / dates.length) * 100) : 0;
            return (
              <div
                key={c.id}
                style={{
                  marginBottom: 16,
                  padding: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 10,
                }}
              >
                <p
                  style={{
                    margin: '0 0 8px',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#e2e8f0',
                  }}
                >
                  {c.name}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 5,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 5,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background:
                          pct >= 75 ? '#059669' : pct >= 50 ? '#d97706' : '#dc2626',
                        borderRadius: 3,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color:
                        pct >= 75 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171',
                      minWidth: 36,
                      textAlign: 'right',
                    }}
                  >
                    {pct}%
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {present}/{dates.length} classes attended
                </p>
              </div>
            );
          })}
          {myClasses.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Enroll in classes to see attendance
            </p>
          )}
        </Card>
      </div>
    </Page>
  );
}

export default function Attendance() {
  const { user } = useApp();
  return user.role === 'teacher' ? <TeacherAttendance /> : <StudentAttendance />;
}
