import { useEffect, useState } from 'react'
import { getSessionAttendance } from '../lib/db'

// Generates and downloads an Excel file using SheetJS (loaded from CDN)
export default function AttendanceDownload({ session, cls, onClose }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    getSessionAttendance(session.id)
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session.id])

  function formatTime(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  function getDuration(join, leave) {
    if (!join || !leave) return '—'
    const mins = Math.round((new Date(leave) - new Date(join)) / 60000)
    if (mins < 1) return '< 1 min'
    return `${mins} min${mins !== 1 ? 's' : ''}`
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      // Load SheetJS from CDN if not already loaded
      if (!window.XLSX) {
        await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js')
      }
      const XLSX = window.XLSX

      // Build rows
      const sessionDate = formatDate(session.started_at || new Date().toISOString())
      const rows = records.map((r, i) => ({
        'S.No':         i + 1,
        'Roll No':      r.roll_no || '—',
        'Student Name': r.student_name,
        'Date':         sessionDate,
        'Join Time':    formatTime(r.join_time),
        'Leave Time':   formatTime(r.leave_time),
        'Duration':     getDuration(r.join_time, r.leave_time),
        'Face Verified': r.verified ? 'Yes' : 'No',
        'Status':       r.leave_time ? 'Complete' : 'Still in class',
      }))

      if (rows.length === 0) {
        rows.push({ 'S.No': '—', 'Roll No': '—', 'Student Name': 'No students joined yet', 'Date': sessionDate, 'Join Time': '—', 'Leave Time': '—', 'Duration': '—', 'Face Verified': '—', 'Status': '—' })
      }

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)

      // Column widths
      ws['!cols'] = [
        { wch: 6 },   // S.No
        { wch: 12 },  // Roll No
        { wch: 24 },  // Name
        { wch: 18 },  // Date
        { wch: 12 },  // Join
        { wch: 12 },  // Leave
        { wch: 12 },  // Duration
        { wch: 14 },  // Verified
        { wch: 16 },  // Status
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

      // Add metadata sheet
      const meta = XLSX.utils.aoa_to_sheet([
        ['Class',       cls.name],
        ['Class Code',  cls.code],
        ['Session',     session.title],
        ['Date',        sessionDate],
        ['Total Joined', records.length],
        ['Generated',   new Date().toLocaleString('en-IN')],
      ])
      XLSX.utils.book_append_sheet(wb, meta, 'Session Info')

      const filename = `Attendance_${cls.code}_${session.title.replace(/\s+/g, '_')}_${sessionDate.replace(/\s+/g, '_')}.xlsx`
      XLSX.writeFile(wb, filename)
    } catch (e) {
      console.error('Excel export failed:', e)
      alert('Failed to generate Excel file. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 20,
        padding: '26px', width: 520, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-dim)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
              📋 Live Attendance
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              {cls.name} · {session.title}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
        </div>

        {/* Stats row */}
        {!loading && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Joined', value: records.length, color: '#3b6d11', bg: '#eaf3de' },
              { label: 'Still in class', value: records.filter(r => !r.leave_time).length, color: '#185fa5', bg: '#e6f1fb' },
              { label: 'Left', value: records.filter(r => r.leave_time).length, color: '#854f0b', bg: '#faeeda' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 11, color: s.color, fontFamily: 'var(--font-body)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, borderRadius: 10, border: '1px solid var(--border-dim)' }}>
          {loading ? (
            <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
          ) : records.length === 0 ? (
            <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No students have joined yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-body)' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  {['Roll No', 'Name', 'Joined', 'Left', 'Duration', '✓ Face'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-dim)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id || i} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{r.roll_no || '—'}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>{r.student_name}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{formatTime(r.join_time)}</td>
                    <td style={{ padding: '8px 12px', color: r.leave_time ? 'var(--text-secondary)' : '#185fa5' }}>
                      {r.leave_time ? formatTime(r.leave_time) : 'Active'}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{getDuration(r.join_time, r.leave_time)}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ color: r.verified ? '#3b6d11' : '#a32d2d', fontSize: 14 }}>
                        {r.verified ? '✓' : '✗'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={downloading || loading}
          style={{
            width: '100%', padding: '11px', borderRadius: 10, border: 'none',
            background: downloading ? 'rgba(201,125,46,0.5)' : 'var(--accent)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: downloading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {downloading ? '⏳ Generating Excel…' : '⬇ Download Attendance (.xlsx)'}
        </button>
      </div>
    </div>
  )
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}
