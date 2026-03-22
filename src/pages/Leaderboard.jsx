import { useApp } from '../context/AppContext';
import Page from '../components/ui/Page';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_EMOJI  = ['🥇', '🥈', '🥉'];
const PODIUM_H    = [200, 240, 170];

export default function Leaderboard() {
  const { user, allUsers } = useApp();

  const students = allUsers
    .filter((u) => u.role === 'student')
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  const myRank = students.findIndex((s) => s.id === user.id) + 1;
  const avg    = students.length
    ? Math.round(students.reduce((a, s) => a + (s.points || 0), 0) / students.length)
    : 0;

  return (
    <Page title="Leaderboard" subtitle="Top performing students this semester">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Left: podium + list */}
        <div>
          {/* Podium (top 3) */}
          {students.length >= 3 && (
            <Card style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, color: '#f1f5f9' }}>
                🏆 Top 3
              </h3>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                }}
              >
                {[1, 0, 2].map((pos) => {
                  const s = students[pos];
                  if (!s) return null;
                  return (
                    <div
                      key={s.id}
                      style={{ flex: 1, textAlign: 'center', maxWidth: 160 }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <Avatar
                          initials={s.avatar}
                          size={pos === 0 ? 52 : 40}
                          colorIndex={pos}
                        />
                      </div>
                      <p
                        style={{
                          margin: '0 0 2px',
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#f1f5f9',
                        }}
                      >
                        {s.name.split(' ')[0]}
                      </p>
                      <p style={{ margin: '0 0 8px', fontSize: 20 }}>
                        {RANK_EMOJI[pos]}
                      </p>
                      <div
                        style={{
                          height: PODIUM_H[pos],
                          background: `rgba(${
                            pos === 0
                              ? '99,102,241'
                              : pos === 1
                              ? '251,191,36'
                              : '201,163,99'
                          },0.12)`,
                          border: `1px solid rgba(${
                            pos === 0
                              ? '99,102,241'
                              : pos === 1
                              ? '251,191,36'
                              : '201,163,99'
                          },0.25)`,
                          borderRadius: '10px 10px 0 0',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 22,
                            fontWeight: 700,
                            color: RANK_COLORS[pos],
                          }}
                        >
                          {s.points || 0}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                          pts
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Full ranked list */}
          <Card>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#f1f5f9' }}>
              Full Rankings
            </h3>
            {students.map((s, i) => {
              const isMe = s.id === user.id;
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '11px 10px',
                    borderRadius: 10,
                    borderBottom:
                      i < students.length - 1
                        ? '1px solid rgba(255,255,255,0.05)'
                        : 'none',
                    background: isMe ? 'rgba(99,102,241,0.07)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      fontSize: i < 3 ? 18 : 13,
                      fontWeight: 600,
                      color:
                        i < 3 ? RANK_COLORS[i] : 'rgba(255,255,255,0.3)',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {i < 3 ? RANK_EMOJI[i] : `#${i + 1}`}
                  </span>

                  <Avatar initials={s.avatar} size={36} colorIndex={i} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: isMe ? 600 : 400,
                        color: isMe ? '#a5b4fc' : '#e2e8f0',
                      }}
                    >
                      {s.name}
                      {isMe && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 11,
                            color: '#6366f1',
                            background: 'rgba(99,102,241,0.15)',
                            padding: '2px 7px',
                            borderRadius: 10,
                          }}
                        >
                          You
                        </span>
                      )}
                    </p>
                    <p
                      style={{
                        margin: '3px 0 0',
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {s.lecturesWatched || 0} lectures watched
                    </p>
                  </div>

                  {/* Points bar */}
                  <div
                    style={{ width: 80, display: 'flex', flexDirection: 'column', gap: 4 }}
                  >
                    <div
                      style={{
                        height: 4,
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${students[0]?.points ? Math.round(((s.points || 0) / students[0].points) * 100) : 0}%`,
                          background: isMe ? '#6366f1' : 'rgba(255,255,255,0.2)',
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 48 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#f1f5f9',
                      }}
                    >
                      {s.points || 0}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      pts
                    </p>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Right: stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#f1f5f9' }}>
              📊 Stats
            </h3>
            {[
              { label: 'Total Students', val: students.length },
              { label: 'Highest Score',  val: students[0]?.points || 0 },
              { label: 'Average Score',  val: avg },
            ].map(({ label, val }) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <p
                  style={{
                    margin: '0 0 4px',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  {label}
                </p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>
                  {val}
                </p>
              </div>
            ))}
          </Card>

          {user.role === 'student' && (
            <Card
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.25)',
              }}
            >
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                Your Rank
              </p>
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#a5b4fc',
                }}
              >
                #{myRank}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                {user.points || 0} points
              </p>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
