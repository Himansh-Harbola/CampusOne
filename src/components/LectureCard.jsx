import { useState } from 'react';
import Btn from './ui/Btn';

export default function LectureCard({ lecture }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-dim)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 22px',
      marginBottom: 12,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: 'var(--accent-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>🎬</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
            {lecture.title}
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)' }}>
            {lecture.duration} · {new Date(lecture.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          {playing && lecture.videoUrl ? (
            <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
              <iframe width="100%" height="100%" src={lecture.videoUrl} title={lecture.title}
                frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen style={{ display: 'block' }} />
            </div>
          ) : (
            <Btn small variant="secondary" onClick={() => setPlaying(true)}>▶ Play Lecture</Btn>
          )}
        </div>
      </div>
    </div>
  );
}
