import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getLeaderboard } from '../lib/db'
import Page from '../components/ui/Page'
import Card from '../components/ui/Card'
import Avatar from '../components/ui/Avatar'

const RANK_COLORS = ['#c97d2e','#7a8a9a','#a0714a']
const RANK_EMOJI  = ['🥇','🥈','🥉']
const PODIUM_H    = [190,230,160]

export default function Leaderboard() {
  const { user } = useApp()
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getLeaderboard().then(d => { setStudents(d||[]); setLoading(false) }).catch(e => { console.error(e); setLoading(false) })
  }, [])

  const myRank = students.findIndex(s => s.id === user.id) + 1
  const avg    = students.length ? Math.round(students.reduce((a,s) => a+(s.points||0), 0) / students.length) : 0

  return (
    <Page title="Department Rankings" subtitle="Top performing students this semester">
      {loading ? <p style={{color:'var(--text-muted)'}}>Loading…</p> : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20 }}>
          <div>
            {students.length >= 3 && (
              <Card style={{ marginBottom:20 }}>
                <h3 style={{ margin:'0 0 20px', fontSize:15, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-serif)' }}>🏆 Top 3</h3>
                <div style={{ display:'flex', gap:12, alignItems:'flex-end', justifyContent:'center' }}>
                  {[1,0,2].map(pos => {
                    const s = students[pos]
                    if(!s) return null
                    return (
                      <div key={s.id} style={{ flex:1, textAlign:'center', maxWidth:160 }}>
                        <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
                          <Avatar initials={s.avatar||'?'} size={pos===0?52:40} colorIndex={pos} />
                        </div>
                        <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{s.name?.split(' ')[0]}</p>
                        <p style={{ margin:'0 0 8px', fontSize:20 }}>{RANK_EMOJI[pos]}</p>
                        <div style={{ height:PODIUM_H[pos], background:pos===0?'var(--accent-light)':'var(--bg-elevated)', border:`1px solid ${pos===0?'var(--accent)':'var(--border-dim)'}`, borderRadius:'10px 10px 0 0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
                          <p style={{ margin:0, fontSize:24, fontFamily:'var(--font-display)', color:RANK_COLORS[pos] }}>{s.points||0}</p>
                          <p style={{ margin:0, fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>pts</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
            <Card>
              <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-serif)' }}>Full Rankings</h3>
              {students.length === 0 ? <p style={{color:'var(--text-muted)',fontSize:13}}>No students yet</p> :
                students.map((s,i) => {
                  const isMe = s.id === user.id
                  return (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'11px 10px', borderRadius:10, borderBottom:i<students.length-1?'1px solid var(--border-dim)':'none', background:isMe?'var(--accent-light)':'transparent' }}>
                      <span style={{ width:28, fontSize:i<3?18:13, fontWeight:600, color:i<3?RANK_COLORS[i]:'var(--text-muted)', textAlign:'center', flexShrink:0 }}>{i<3?RANK_EMOJI[i]:`#${i+1}`}</span>
                      <Avatar initials={s.avatar||'?'} size={36} colorIndex={i} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:0, fontSize:14, fontWeight:isMe?700:500, color:isMe?'var(--accent-text)':'var(--text-primary)' }}>
                          {s.name}
                          {isMe && <span style={{ marginLeft:8, fontSize:11, color:'var(--accent)', background:'rgba(201,125,46,0.15)', padding:'2px 8px', borderRadius:10 }}>You</span>}
                        </p>
                        <p style={{ margin:'3px 0 0', fontSize:12, color:'var(--text-muted)' }}>{s.lectures_watched||0} lectures watched</p>
                      </div>
                      <div style={{ width:70 }}>
                        <div style={{ height:4, background:'var(--border-dim)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${students[0]?.points?Math.round(((s.points||0)/students[0].points)*100):0}%`, background:isMe?'var(--accent)':'var(--border-subtle)', borderRadius:2 }} />
                        </div>
                      </div>
                      <div style={{ textAlign:'right', minWidth:48 }}>
                        <p style={{ margin:0, fontSize:16, fontWeight:700, fontFamily:'var(--font-display)', color:'var(--text-primary)' }}>{s.points||0}</p>
                        <p style={{ margin:0, fontSize:11, color:'var(--text-muted)' }}>pts</p>
                      </div>
                    </div>
                  )
                })}
            </Card>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Card>
              <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-serif)' }}>📊 Stats</h3>
              {[['Total Students',students.length],['Highest Score',students[0]?.points||0],['Average Score',avg]].map(([label,val])=>(
                <div key={label} style={{ marginBottom:16 }}>
                  <p style={{ margin:'0 0 4px', fontSize:12, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>{label}</p>
                  <p style={{ margin:0, fontSize:28, fontFamily:'var(--font-display)', color:'var(--text-primary)' }}>{val}</p>
                </div>
              ))}
            </Card>
            {user.role==='student' && (
              <Card style={{ background:'var(--accent-light)', border:'1px solid var(--accent)' }}>
                <p style={{ margin:'0 0 4px', fontSize:12, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>Your Rank</p>
                <p style={{ margin:'0 0 4px', fontSize:40, fontFamily:'var(--font-display)', color:'var(--accent-text)', lineHeight:1 }}>#{myRank || '—'}</p>
                <p style={{ margin:0, fontSize:13, color:'var(--text-secondary)' }}>{user.points||0} points</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </Page>
  )
}
