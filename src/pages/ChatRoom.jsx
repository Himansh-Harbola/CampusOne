import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Btn from '../components/ui/Btn';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';

export default function ChatRoom() {
  const { user, classes, chatrooms, setChatrooms, allUsers, theme } = useApp();
  const isDark = theme === 'dark';

  const isTeacher = user.role === 'teacher';
  const myClasses = classes.filter(c => isTeacher ? c.teacherId === user.id : c.students.includes(user.id));
  const myRooms   = chatrooms.filter(cr => myClasses.some(c => c.id === cr.classId));

  const [selectedId, setSelectedId] = useState(myRooms[0]?.id || null);
  const [message, setMessage]       = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom]       = useState({ name: '', classId: '' });
  const messagesEndRef = useRef(null);

  const room    = chatrooms.find(r => r.id === selectedId);
  const roomCls = room ? classes.find(c => c.id === room.classId) : null;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [room?.messages?.length]);

  function sendMessage() {
    if (!message.trim() || !selectedId) return;
    const msg = { id: 'm' + Date.now(), userId: user.id, text: message.trim(), time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), date: new Date().toISOString().slice(0, 10) };
    setChatrooms(prev => prev.map(r => r.id === selectedId ? { ...r, messages: [...r.messages, msg] } : r));
    setMessage('');
  }

  function createRoom() {
    if (!newRoom.name || !newRoom.classId) return;
    const nr = { id: 'cr' + Date.now(), name: newRoom.name, classId: newRoom.classId, teacherId: user.id, messages: [] };
    setChatrooms(prev => [...prev, nr]);
    setSelectedId(nr.id);
    setNewRoom({ name: '', classId: '' });
    setShowCreate(false);
  }

  const sidebarBg   = isDark ? '#0d0f1f' : '#f5f0e8';
  const sidebarBorder = isDark ? '#1e2040' : '#e0d8cc';
  const headerBg    = isDark ? '#0d0f1f' : '#f5f0e8';
  const activeBg    = isDark ? 'rgba(201,125,46,0.12)' : 'rgba(201,125,46,0.1)';
  const msgAreaBg   = isDark ? '#0d0e1a' : '#faf7f2';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Room list sidebar */}
      <aside style={{ width: 260, background: sidebarBg, borderRight: `1px solid ${sidebarBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px', borderBottom: `1px solid ${sidebarBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>💬 Chatrooms</h2>
          {isTeacher && <Btn small onClick={() => setShowCreate(true)}>+</Btn>}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {myRooms.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 12px' }}>No chatrooms yet</p>
          ) : myRooms.map(cr => {
            const cls     = classes.find(c => c.id === cr.classId);
            const lastMsg = cr.messages[cr.messages.length - 1];
            const active  = selectedId === cr.id;
            return (
              <button key={cr.id} onClick={() => setSelectedId(cr.id)} style={{
                width: '100%', padding: '11px 12px', borderRadius: 10, border: 'none',
                borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                background: active ? activeBg : 'transparent',
                textAlign: 'left', cursor: 'pointer', marginBottom: 2,
                fontFamily: 'var(--font-body)',
              }}>
                <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: active ? 'var(--accent-text)' : 'var(--text-primary)' }}>{cr.name}</p>
                <p style={{ margin: '0 0 3px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cls?.code}</p>
                {lastMsg && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastMsg.text}</p>}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Chat area */}
      {room ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '14px 24px', borderBottom: `1px solid ${sidebarBorder}`, background: headerBg, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💬</div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{room.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{roomCls?.name} · {room.messages.length} messages</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 2, background: msgAreaBg }}>
            {room.messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 40 }}>💬</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No messages yet — start the conversation!</p>
              </div>
            ) : room.messages.map((msg, i) => {
              const isMe      = msg.userId === user.id;
              const sender    = allUsers.find(u => u.id === msg.userId);
              const prevMsg   = room.messages[i - 1];
              const showAvatar = !prevMsg || prevMsg.userId !== msg.userId;
              const colorIndex = allUsers.findIndex(u => u.id === msg.userId);

              return (
                <div key={msg.id} style={{ display: 'flex', gap: 10, flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', marginBottom: showAvatar ? 12 : 3 }}>
                  <div style={{ width: 32, flexShrink: 0 }}>
                    {showAvatar && !isMe && <Avatar initials={sender?.avatar || '?'} size={32} colorIndex={colorIndex} />}
                  </div>
                  <div style={{ maxWidth: '65%' }}>
                    {showAvatar && !isMe && (
                      <p style={{ margin: '0 0 4px 4px', fontSize: 11, color: 'var(--text-muted)' }}>
                        {sender?.name}
                        {sender?.role === 'teacher' && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--accent-text)', background: 'var(--accent-light)', padding: '1px 7px', borderRadius: 8, fontWeight: 600 }}>Teacher</span>
                        )}
                      </p>
                    )}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background: isMe ? 'var(--accent-light)' : 'var(--bg-surface)',
                      border: isMe ? '1px solid var(--accent)' : '1px solid var(--border-dim)',
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      <p style={{ margin: 0, fontSize: 14, color: isMe ? 'var(--accent-text)' : 'var(--text-primary)', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</p>
                    </div>
                    <p style={{ margin: '4px 4px 0', fontSize: 11, color: 'var(--text-muted)', textAlign: isMe ? 'right' : 'left' }}>{msg.time}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: '14px 24px', borderTop: `1px solid ${sidebarBorder}`, background: headerBg, display: 'flex', gap: 10 }}>
            <input
              value={message} onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message… (Enter to send)"
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
            />
            <Btn onClick={sendMessage} disabled={!message.trim()}>Send →</Btn>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: msgAreaBg }}>
          <p style={{ fontSize: 48 }}>💬</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{myRooms.length === 0 ? 'No chatrooms available' : 'Select a chatroom to start chatting'}</p>
          {isTeacher && myRooms.length === 0 && <Btn onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}>+ Create Chatroom</Btn>}
        </div>
      )}

      {showCreate && (
        <Modal title="Create Chatroom" onClose={() => setShowCreate(false)}>
          <Input label="Room Name *" value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="e.g. DSA Doubts" />
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Class *</label>
            <select value={newRoom.classId} onChange={e => setNewRoom({ ...newRoom, classId: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}>
              <option value="">Select class</option>
              {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Btn onClick={createRoom}>Create Room</Btn>
        </Modal>
      )}
    </div>
  );
}
