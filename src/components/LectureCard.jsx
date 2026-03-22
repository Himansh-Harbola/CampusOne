import { useState } from 'react';
import Btn from './ui/Btn';

export default function LectureCard({ lecture }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      style={{
        background: '#1a1d2e',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'rgba(99,102,241,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          🎬
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: '0 0 4px',
              fontSize: 15,
              fontWeight: 600,
              color: '#f1f5f9',
            }}
          >
            {lecture.title}
          </p>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            {lecture.duration} ·{' '}
            {new Date(lecture.date).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          {playing && lecture.videoUrl ? (
            <div
              style={{
                borderRadius: 10,
                overflow: 'hidden',
                aspectRatio: '16/9',
                background: '#000',
              }}
            >
              <iframe
                width="100%"
                height="100%"
                src={lecture.videoUrl}
                title={lecture.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ display: 'block' }}
              />
            </div>
          ) : (
            <Btn small variant="secondary" onClick={() => setPlaying(true)}>
              ▶ Play Lecture
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
