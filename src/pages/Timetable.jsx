import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Page from '../components/ui/Page';
import Card from '../components/ui/Card';
import Btn from '../components/ui/Btn';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { getClasses } from '../lib/db';

const DAYS  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'];
const COLORS = ['#c97d2e','#2e7dc9','#2ec97d','#c92e7d','#7d2ec9','#c9a02e'];

function hourToSlot(h24) {
  if (h24 < 8)  return '8:00 AM';
  if (h24 >= 17) return '5:00 PM';
  if (h24 === 12) return '12:00 PM';
  if (h24 > 12)  return `${h24 - 12}:00 PM`;
  return `${h24}:00 AM`;
}

function parseHour(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase().replace(/\./g, ':');
  const pm = s.includes('PM'), am = s.includes('AM');
  const nums = s.replace(/[^0-9:]/g, '');
  const parts = nums.split(':');
  let h = parseInt(parts[0], 10);
  const min = parseInt(parts[1] || '0', 10);
  if (isNaN(h)) return null;
  if (pm && h !== 12) h += 12;
  if (am && h === 12) h = 0;
  if (!pm && !am && h < 8) h += 12;
  if (min >= 30) h += 1;
  return Math.min(Math.max(h, 8), 17);
}

function matchClass(cellText, cls) {
  const t = cellText.toLowerCase();
  if (t.includes(cls.code.toLowerCase())) return true;
  const words = cls.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  return words.some(w => t.includes(w));
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function Timetable() {
  const { user } = useApp();
  const storageKey = `timetable_${user.id}`;
  const fileInputRef = useRef(null);

  const [schedule, setSchedule] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; }
  });
  const [myClasses, setMyClasses]   = useState([]);
  const [showAdd, setShowAdd]       = useState(false);
  const [showScan, setShowScan]     = useState(false);
  const [form, setForm] = useState({ day: 'Monday', time: '9:00 AM', label: '', colorIdx: 0 });
  const [scanImage, setScanImage]   = useState(null);
  const [scanPhase, setScanPhase]   = useState('idle');
  const [scanResult, setScanResult] = useState([]);
  const [scanError, setScanError]   = useState('');

  useEffect(() => {
    getClasses(user.id, user.role).then(setMyClasses).catch(() => {});
  }, [user.id]);

  function save(newSchedule) {
    setSchedule(newSchedule);
    localStorage.setItem(storageKey, JSON.stringify(newSchedule));
  }

  function addEntry() {
    if (!form.label) return;
    const key = `${form.day}_${form.time}`;
    save({ ...schedule, [key]: { label: form.label, color: COLORS[form.colorIdx], day: form.day, time: form.time } });
    setShowAdd(false);
    setForm({ day: 'Monday', time: '9:00 AM', label: '', colorIdx: 0 });
  }

  function removeEntry(key) {
    const updated = { ...schedule };
    delete updated[key];
    save(updated);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setScanImage({ file, previewUrl: URL.createObjectURL(file) });
    setScanPhase('idle'); setScanResult([]); setScanError('');
  }

  async function handleScan() {
    if (!scanImage) return;
    setScanPhase('scanning'); setScanError('');
    try {
      const base64 = await fileToBase64(scanImage.file);
      const classContext = myClasses.length
        ? myClasses.map(c => `- "${c.name}" (code: ${c.code})`).join('\n')
        : '(no classes registered yet)';

      const prompt = `You are reading a college timetable image.

The user's classes are:
${classContext}

Extract EVERY cell from this timetable that contains a class/subject. For each entry return:
- day: exact day name (Monday/Tuesday/Wednesday/Thursday/Friday/Saturday)
- time: the time slot as shown (e.g. "9:00 AM", "10 AM", "14:00")
- subject: the subject/class name exactly as shown in the image
- matched_class_code: if this subject matches one of the user's classes above, put its code here, otherwise null

Respond ONLY with a JSON array, no markdown, no explanation. Example:
[{"day":"Monday","time":"9:00 AM","subject":"Data Structures","matched_class_code":"CS301"}]
If the image has no readable timetable, return [].`;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: scanImage.file.type || 'image/jpeg', data: base64 } },
              { type: 'text', text: prompt },
            ],
          }],
        }),
      });

      const data = await res.json();
      const raw = data.content?.find(b => b.type === 'text')?.text || '[]';
      const entries = JSON.parse(raw.replace(/```json|```/g, '').trim());

      if (!Array.isArray(entries) || entries.length === 0) {
        setScanError('No timetable entries found in the image. Try a clearer photo.');
        setScanPhase('error'); return;
      }

      const colorMap = {}; let ci = 0;
      const rows = entries.map(e => {
        const h = parseHour(e.time);
        const slot = h ? hourToSlot(h) : null;
        let matchedCls = myClasses.find(c => e.matched_class_code && c.code.toLowerCase() === e.matched_class_code.toLowerCase());
        if (!matchedCls) matchedCls = myClasses.find(c => matchClass(e.subject || '', c));
        const label = matchedCls ? `${matchedCls.code} — ${matchedCls.name}` : e.subject;
        if (!colorMap[label]) { colorMap[label] = COLORS[ci % COLORS.length]; ci++; }
        return { day: e.day, time: slot, rawTime: e.time, label, color: colorMap[label], matched: !!matchedCls, valid: !!slot && DAYS.includes(e.day) };
      });

      setScanResult(rows); setScanPhase('review');
    } catch (err) {
      setScanError(err.message || 'Failed to read image.'); setScanPhase('error');
    }
  }

  function applyResults() {
    const updated = { ...schedule };
    scanResult.forEach(r => { if (r.valid) updated[`${r.day}_${r.time}`] = { label: r.label, color: r.color, day: r.day, time: r.time }; });
    save(updated); setScanPhase('done');
    setTimeout(() => { setShowScan(false); resetScan(); }, 1500);
  }

  function resetScan() {
    setScanPhase('idle'); setScanImage(null); setScanResult([]); setScanError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <Page
      title="Timetable"
      subtitle="Weekly schedule — add and manage your classes"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={() => setShowScan(true)}>📷 Scan from Image</Btn>
          <Btn onClick={() => setShowAdd(true)}>+ Add Class</Btn>
        </div>
      }
    >
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-dim)', width: 90 }}>Time</th>
                {DAYS.map(day => (
                  <th key={day} style={{ padding: '14px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-dim)', borderLeft: '1px solid var(--border-dim)' }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour, hi) => (
                <tr key={hour} style={{ background: hi % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-dim)', whiteSpace: 'nowrap' }}>{hour}</td>
                  {DAYS.map(day => {
                    const key = `${day}_${hour}`;
                    const entry = schedule[key];
                    return (
                      <td key={day} style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-dim)', borderLeft: '1px solid var(--border-dim)', verticalAlign: 'top', minWidth: 120 }}>
                        {entry ? (
                          <div style={{ padding: '7px 10px', borderRadius: 7, background: entry.color + '18', border: `1px solid ${entry.color}40`, position: 'relative' }}>
                            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{entry.label}</p>
                            <button onClick={() => removeEntry(key)} style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: '2px 4px', borderRadius: 4, opacity: 0.6 }}>×</button>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {Object.keys(schedule).length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[...new Set(Object.values(schedule).map(e => e.label))].map(label => {
            const entry = Object.values(schedule).find(e => e.label === label);
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: entry.color + '18', border: `1px solid ${entry.color}40` }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.color }} />
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual add */}
      {showAdd && (
        <Modal title="Add to Timetable" onClose={() => setShowAdd(false)}>
          <div style={{ marginBottom: 16 }}>
            <label style={LS}>Day</label>
            <select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} style={SS}>{DAYS.map(d => <option key={d}>{d}</option>)}</select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={LS}>Time</label>
            <select value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={SS}>{HOURS.map(h => <option key={h}>{h}</option>)}</select>
          </div>
          <Input label="Class / Label" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. CS301 — Data Structures" />
          {myClasses.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={LS}>Quick pick</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {myClasses.map(c => <button key={c.id} onClick={() => setForm(f => ({ ...f, label: `${c.code} — ${c.name}` }))} style={CS}>{c.code}</button>)}
              </div>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <p style={LS}>Color</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map((c, i) => <button key={c} onClick={() => setForm(f => ({ ...f, colorIdx: i }))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.colorIdx === i ? '3px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />)}
            </div>
          </div>
          <Btn onClick={addEntry}>Add to Timetable</Btn>
        </Modal>
      )}

      {/* Image scan */}
      {showScan && (
        <Modal title="📷 Scan Timetable from Image" onClose={() => { setShowScan(false); resetScan(); }}>

          {scanPhase === 'idle' && (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                Upload a photo of your college timetable. AI will read it, match subjects to your registered classes, and fill the schedule automatically.
              </p>
              {myClasses.length > 0 && (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                  <p style={LS}>Will match against your classes</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {myClasses.map(c => <span key={c.id} style={{ ...CS, cursor: 'default' }}>{c.code} — {c.name}</span>)}
                  </div>
                </div>
              )}
              <div onClick={() => fileInputRef.current?.click()} style={{ border: `2px dashed ${scanImage ? 'var(--accent)' : 'var(--border-subtle)'}`, borderRadius: 14, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: scanImage ? 'rgba(201,125,46,0.04)' : 'var(--bg-elevated)', marginBottom: 16 }}>
                {scanImage ? (
                  <>
                    <img src={scanImage.previewUrl} alt="preview" style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, marginBottom: 10 }} />
                    <p style={{ fontSize: 12, color: 'var(--accent)', margin: 0 }}>✓ {scanImage.file.name} — click to change</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Click to upload timetable image</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>JPG, PNG, WEBP — photo or screenshot both work</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              <Btn onClick={handleScan} disabled={!scanImage} style={{ width: '100%' }}>🔍 Scan &amp; Extract Timetable</Btn>
            </>
          )}

          {scanPhase === 'scanning' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px', fontFamily: 'var(--font-serif)' }}>Reading your timetable…</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>AI is detecting subjects, days, and time slots</p>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: `livePulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          )}

          {scanPhase === 'review' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Found {scanResult.length} entries</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: '#eaf3de', color: '#3b6d11' }}>✓ {scanResult.filter(r => r.matched).length} matched</span>
                  {scanResult.filter(r => !r.valid).length > 0 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: '#fcebeb', color: '#a32d2d' }}>⚠ {scanResult.filter(r => !r.valid).length} skipped</span>}
                </div>
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--border-dim)', borderRadius: 10, marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)' }}>
                      {['Day','Time','Subject','Status'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-dim)' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {scanResult.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-dim)', opacity: r.valid ? 1 : 0.45 }}>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{r.day}</td>
                        <td style={{ padding: '8px 12px', color: r.valid ? 'var(--text-secondary)' : '#a32d2d' }}>{r.valid ? r.time : `${r.rawTime} ⚠`}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-primary)', fontWeight: r.matched ? 600 : 400 }}>{r.label}</span>
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {r.matched ? <span style={{ color: '#3b6d11', fontSize: 11 }}>✓ Matched</span> : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>New</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>Entries with unreadable times will be skipped. Existing slots will be overwritten.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn onClick={applyResults} style={{ flex: 1 }}>✅ Apply ({scanResult.filter(r => r.valid).length} entries)</Btn>
                <button onClick={resetScan} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Try Again</button>
              </div>
            </>
          )}

          {scanPhase === 'error' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>❌</div>
              <p style={{ fontSize: 13, color: '#a32d2d', marginBottom: 16 }}>{scanError}</p>
              <Btn onClick={resetScan}>Try Again</Btn>
            </div>
          )}

          {scanPhase === 'done' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#3b6d11', fontFamily: 'var(--font-serif)' }}>Timetable updated!</p>
            </div>
          )}
        </Modal>
      )}
    </Page>
  );
}

const LS = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' };
const SS = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)' };
const CS = { padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' };
