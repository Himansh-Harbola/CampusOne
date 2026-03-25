import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { getChatrooms, createChatroom, getMessages, sendMessage, getClasses, getAllClassesForStudent } from '../lib/db'
import { supabase } from '../lib/supabase'
import Btn from '../components/ui/Btn'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'

export default function ChatRoom() {
  const { user, theme } = useApp()
  const isDark = theme === 'dark'
  const isTeacher = user.role === 'teacher'

  const [classes, setClasses]     = useState([])
  const [rooms, setRooms]         = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages]   = useState([])
  const [message, setMessage]     = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newRoom, setNewRoom]     = useState({ name:'', classId:'' })
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const messagesEndRef = useRef(null)

  // Load classes + chatrooms
  useEffect(() => {
    async function load() {
      try {
        const cls = isTeacher
          ? await getClasses(user.id, 'teacher')
          : (await getAllClassesForStudent()).filter(c => (c.enrollments||[]).some(e=>e.student_id===user.id))
        setClasses(cls||[])
        const classIds = (cls||[]).map(c=>c.id)
        const cr = await getChatrooms(classIds)
        setRooms(cr||[])
        if(cr?.length) setSelectedId(cr[0].id)
      } catch(e){ console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user.id, isTeacher])

  // Load messages when room changes
  useEffect(() => {
    if(!selectedId) return
    getMessages(selectedId).then(m => setMessages(m||[])).catch(console.error)
  }, [selectedId])

  // Supabase Realtime subscription for live messages
  useEffect(() => {
    if(!selectedId) return
    const channel = supabase
      .channel(`messages:${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chatroom_id=eq.${selectedId}`,
      }, async (payload) => {
        // Fetch full message with profile
        const { data } = await supabase
          .from('messages')
          .select('*, profiles(name, avatar, role)')
          .eq('id', payload.new.id)
          .single()
        if(data) setMessages(prev => {
          // Avoid duplicates
          if(prev.some(m=>m.id===data.id)) return prev
          return [...prev, data]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedId])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages.length])

  async function handleSend() {
    if(!message.trim() || !selectedId || sending) return
    setSending(true)
    try {
      await sendMessage({ chatroomId: selectedId, userId: user.id, text: message.trim() })
      setMessage('')
      // Realtime will add the message via subscription
    } catch(e){ alert(e.message) }
    finally { setSending(false) }
  }

  async function handleCreateRoom() {
    if(!newRoom.name || !newRoom.classId) return
    try {
      const nr = await createChatroom({ name: newRoom.name, classId: newRoom.classId, createdBy: user.id })
      const withClass = { ...nr, classes: classes.find(c=>c.id===nr.class_id) }
      setRooms(prev => [...prev, withClass])
      setSelectedId(nr.id)
      setNewRoom({ name:'', classId:'' })
      setShowCreate(false)
    } catch(e){ alert(e.message) }
  }

  const room    = rooms.find(r=>r.id===selectedId)
  const roomCls = room?.classes

  const sidebarBg     = isDark ? '#0d0f1f' : '#f5f0e8'
  const sidebarBorder = isDark ? '#1e2040' : '#e0d8cc'
  const headerBg      = isDark ? '#0d0f1f' : '#f5f0e8'
  const msgAreaBg     = isDark ? '#0d0e1a' : '#faf7f2'
  const activeBg      = isDark ? 'rgba(201,125,46,0.12)' : 'rgba(201,125,46,0.1)'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* Room list */}
      <aside style={{ width:260, background:sidebarBg, borderRight:`1px solid ${sidebarBorder}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'18px 16px', borderBottom:`1px solid ${sidebarBorder}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>💬 Discussion Forum</h2>
          {isTeacher && <Btn small onClick={()=>setShowCreate(true)}>+</Btn>}
        </div>
        <div style={{ flex:1, overflow:'auto', padding:'8px' }}>
          {loading ? <p style={{color:'var(--text-muted)',fontSize:13,padding:'16px 12px'}}>Loading…</p> :
            rooms.length===0 ? <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'24px 12px' }}>No rooms yet</p> :
            rooms.map(cr => {
              const active = selectedId===cr.id
              return (
                <button key={cr.id} onClick={()=>setSelectedId(cr.id)} style={{ width:'100%', padding:'11px 12px', borderRadius:10, border:'none', borderLeft:active?'3px solid var(--accent)':'3px solid transparent', background:active?activeBg:'transparent', textAlign:'left', cursor:'pointer', marginBottom:2, fontFamily:'var(--font-body)' }}>
                  <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:600, color:active?'var(--accent-text)':'var(--text-primary)' }}>{cr.name}</p>
                  <p style={{ margin:0, fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{cr.classes?.code||cr.class_id}</p>
                </button>
              )
            })}
        </div>
      </aside>

      {/* Chat area */}
      {room ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'14px 24px', borderBottom:`1px solid ${sidebarBorder}`, background:headerBg, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>💬</div>
            <div>
              <p style={{ margin:0, fontSize:15, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>{room.name}</p>
              <p style={{ margin:0, fontSize:12, color:'var(--text-muted)' }}>{roomCls?.name} · {messages.length} messages</p>
            </div>
          </div>

          <div style={{ flex:1, overflow:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:2, background:msgAreaBg }}>
            {messages.length===0 ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
                <p style={{ fontSize:40 }}>💬</p>
                <p style={{ color:'var(--text-muted)', fontSize:14 }}>No messages yet — start the conversation!</p>
              </div>
            ) : messages.map((msg,i) => {
              const isMe      = msg.user_id === user.id
              const sender    = msg.profiles
              const prevMsg   = messages[i-1]
              const showAvatar = !prevMsg || prevMsg.user_id !== msg.user_id
              const time = new Date(msg.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
              const colorIndex = msg.user_id.charCodeAt(0) % 8

              return (
                <div key={msg.id} style={{ display:'flex', gap:10, flexDirection:isMe?'row-reverse':'row', alignItems:'flex-end', marginBottom:showAvatar?12:3 }}>
                  <div style={{ width:32, flexShrink:0 }}>
                    {showAvatar && !isMe && <Avatar initials={sender?.avatar||'?'} size={32} colorIndex={colorIndex} />}
                  </div>
                  <div style={{ maxWidth:'65%' }}>
                    {showAvatar && !isMe && (
                      <p style={{ margin:'0 0 4px 4px', fontSize:11, color:'var(--text-muted)' }}>
                        {sender?.name}
                        {sender?.role==='teacher' && <span style={{ marginLeft:6, fontSize:10, color:'var(--accent-text)', background:'var(--accent-light)', padding:'1px 7px', borderRadius:8, fontWeight:600 }}>Teacher</span>}
                      </p>
                    )}
                    <div style={{ padding:'10px 14px', borderRadius:isMe?'16px 4px 16px 16px':'4px 16px 16px 16px', background:isMe?'var(--accent-light)':'var(--bg-surface)', border:isMe?'1px solid var(--accent)':'1px solid var(--border-dim)', boxShadow:'var(--shadow-sm)' }}>
                      <p style={{ margin:0, fontSize:14, color:isMe?'var(--accent-text)':'var(--text-primary)', lineHeight:1.5, wordBreak:'break-word' }}>{msg.text}</p>
                    </div>
                    <p style={{ margin:'4px 4px 0', fontSize:11, color:'var(--text-muted)', textAlign:isMe?'right':'left' }}>{time}</p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding:'14px 24px', borderTop:`1px solid ${sidebarBorder}`, background:headerBg, display:'flex', gap:10 }}>
            <input value={message} onChange={e=>setMessage(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handleSend()}
              placeholder="Type a message… (Enter to send)"
              style={{ flex:1, padding:'10px 14px', borderRadius:10, border:'1px solid var(--border-subtle)', background:'var(--bg-input)', color:'var(--text-primary)', fontSize:14, outline:'none', fontFamily:'var(--font-body)', transition:'border-color 0.15s' }}
              onFocus={e=>e.target.style.borderColor='var(--accent)'}
              onBlur={e=>e.target.style.borderColor='var(--border-subtle)'} />
            <Btn onClick={handleSend} disabled={!message.trim()||sending}>{sending?'…':'Send →'}</Btn>
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, background:msgAreaBg }}>
          <p style={{ fontSize:48 }}>💬</p>
          <p style={{ color:'var(--text-muted)', fontSize:15 }}>{rooms.length===0?'No discussion rooms yet':'Select a room to start chatting'}</p>
          {isTeacher && rooms.length===0 && <Btn onClick={()=>setShowCreate(true)} style={{marginTop:8}}>+ Create Room</Btn>}
        </div>
      )}

      {showCreate && (
        <Modal title="Create Discussion Room" onClose={()=>setShowCreate(false)}>
          <Input label="Room Name *" value={newRoom.name} onChange={e=>setNewRoom({...newRoom,name:e.target.value})} placeholder="e.g. DSA Doubts" />
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Class *</label>
            <select value={newRoom.classId} onChange={e=>setNewRoom({...newRoom,classId:e.target.value})} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border-subtle)', background:'var(--bg-input)', color:'var(--text-primary)', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'var(--font-body)' }}>
              <option value="">Select class</option>
              {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Btn onClick={handleCreateRoom}>Create Room</Btn>
        </Modal>
      )}
    </div>
  )
}
