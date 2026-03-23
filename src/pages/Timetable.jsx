import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Page from '../components/ui/Page';
import Card from '../components/ui/Card';
import Btn from '../components/ui/Btn';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'];
const COLORS = ['#c97d2e','#2e7dc9','#2ec97d','#c92e7d','#7d2ec9','#c9a02e'];

export default function Timetable() {
  const { user, classes } = useApp();
  const storageKey = `timetable_${user.id}`;
  const [schedule, setSchedule] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ day: 'Monday', time: '9:00 AM', label: '', colorIdx: 0 });

  function save(newSchedule) {
    setSchedule(newSchedule);
    localStorage.setItem(storageKey, JSON.stringify(newSchedule));
  }

  function addEntry() {
    if (!form.label) return;
    const key = `${form.day}_${form.time}`;
    const updated = { ...schedule, [key]: { label: form.label, color: COLORS[form.colorIdx], day: form.day, time: form.time } };
    save(updated);
    setShowAdd(false);
    setForm({ day: 'Monday', time: '9:00 AM', label: '', colorIdx: 0 });
  }

  function removeEntry(key) {
    const updated = { ...schedule };
    delete updated[key];
    save(updated);
  }

  const myClasses = classes.filter(c => user.role === 'teacher' ? c.teacherId === user.id : c.students.includes(user.id));

  return (
    <Page title="Timetable" subtitle="Weekly schedule — add and manage your classes" actions={<Btn onClick={() => setShowAdd(true)}>+ Add Class</Btn>}>
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
                    const key   = `${day}_${hour}`;
                    const entry = schedule[key];
                    return (
                      <td key={day} style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-dim)', borderLeft: '1px solid var(--border-dim)', verticalAlign: 'top', minWidth: 120, position: 'relative' }}>
                        {entry ? (
                          <div style={{ padding: '7px 10px', borderRadius: 7, background: entry.color + '18', border: `1px solid ${entry.color}40`, position: 'relative', group: 'entry' }}>
                            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{entry.label}</p>
                            <button onClick={() => removeEntry(key)} style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '2px 4px', borderRadius: 4, opacity: 0.6 }} title="Remove">×</button>
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

      {/* Legend */}
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

      {showAdd && (
        <Modal title="Add to Timetable" onClose={() => setShowAdd(false)}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Day</label>
            <select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', marginBottom: 0 }}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Time</label>
            <select value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)' }}>
              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <Input label="Class / Label" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. CS301 — Data Structures" />
          {myClasses.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick pick from your classes</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {myClasses.map(c => (
                  <button key={c.id} onClick={() => setForm(f => ({ ...f, label: `${c.code} — ${c.name}` }))} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    {c.code}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Color</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map((c, i) => (
                <button key={c} onClick={() => setForm(f => ({ ...f, colorIdx: i }))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.colorIdx === i ? `3px solid var(--text-primary)` : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
          </div>
          <Btn onClick={addEntry}>Add to Timetable</Btn>
        </Modal>
      )}
    </Page>
  );
}
