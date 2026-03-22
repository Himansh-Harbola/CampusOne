import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Btn from '../components/ui/Btn';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';

export default function ChatRoom() {
  const { user, classes, chatrooms, setChatrooms, allUsers } = useApp();

  const isTeacher = user.role === 'teacher';
  const myClasses = classes.filter((c) =>
    isTeacher ? c.teacherId === user.id : c.students.includes(user.id),
  );
  const myRooms = chatrooms.filter((cr) =>
    myClasses.some((c) => c.id === cr.classId),
  );

  const [selectedId, setSelectedId]   = useState(myRooms[0]?.id || null);
  const [message, setMessage]         = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [newRoom, setNewRoom]         = useState({ name: '', classId: '' });
  const messagesEndRef = useRef(null);

  const room = chatrooms.find((r) => r.id === selectedId);
  const roomCls = room ? classes.find((c) => c.id === room.classId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages?.length]);

  function sendMessage() {
    if (!message.trim() || !selectedId) return;
    const msg = {
      id:     'm' + Date.now(),
      userId: user.id,
      text:   message.trim(),
      time:   new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      date:   new Date().toISOString().slice(0, 10),
    };
    setChatrooms((prev) =>
      prev.map((r) =>
        r.id === selectedId ? { ...r, messages: [...r.messages, msg] } : r,
      ),
    );
    setMessage('');
  }

  function createRoom() {
    if (!newRoom.name || !newRoom.classId) return;
    const nr = {
      id:        'cr' + Date.now(),
      name:      newRoom.name,
      classId:   newRoom.classId,
      teacherId: user.id,
      messages:  [],
    };
    setChatrooms((prev) => [...prev, nr]);
    setSelectedId(nr.id);
    setNewRoom({ name: '', classId: '' });
    setShowCreate(false);
  }

  function getUserInfo(uid) {
    return allUsers.find((u) => u.id === uid);
  }

  const selectStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 9,
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#0f1117',
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    marginBottom: 16,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ── Sidebar: room list ── */}
      <aside
        style={{
          width: 260,
          background: '#13151f',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '18px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>
            💬 Chatrooms
          </h2>
          {isTeacher && (
            <Btn small onClick={() => setShowCreate(true)}>
              +
            </Btn>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {myRooms.length === 0 ? (
            <p
              style={{
                color: 'rgba(255,255,255,0.25)',
                fontSize: 13,
                textAlign: 'center',
                padding: '24px 12px',
              }}
            >
              No chatrooms yet
            </p>
          ) : (
            myRooms.map((cr) => {
              const cls     = classes.find((c) => c.id === cr.classId);
              const lastMsg = cr.messages[cr.messages.length - 1];
              const active  = selectedId === cr.id;
              return (
                <button
                  key={cr.id}
                  onClick={() => setSelectedId(cr.id)}
                  style={{
                    width: '100%',
                    padding: '11px 10px',
                    borderRadius: 10,
                    border: 'none',
                    background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    marginBottom: 2,
                    transition: 'background 0.15s',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 2px',
                      fontSize: 14,
                      fontWeight: 500,
                      color: active ? '#a5b4fc' : '#e2e8f0',
                    }}
                  >
                    {cr.name}
                  </p>
                  <p
                    style={{
                      margin: '0 0 3px',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {cls?.code}
                  </p>
                  {lastMsg && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.22)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lastMsg.text}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Main: chat area ── */}
      {room ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div
            style={{
              padding: '14px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: '#13151f',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(99,102,241,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              💬
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
                {room.name}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                {roomCls?.name} · {room.messages.length} messages
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {room.messages.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <p style={{ fontSize: 40 }}>💬</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                  No messages yet — start the conversation!
                </p>
              </div>
            ) : (
              room.messages.map((msg, i) => {
                const isMe       = msg.userId === user.id;
                const sender     = getUserInfo(msg.userId);
                const prevMsg    = room.messages[i - 1];
                const showAvatar = !prevMsg || prevMsg.userId !== msg.userId;
                const colorIndex = allUsers.findIndex((u) => u.id === msg.userId);

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexDirection: isMe ? 'row-reverse' : 'row',
                      alignItems: 'flex-end',
                      marginBottom: showAvatar ? 12 : 3,
                    }}
                  >
                    {/* Avatar spacer */}
                    <div style={{ width: 32, flexShrink: 0 }}>
                      {showAvatar && !isMe && (
                        <Avatar
                          initials={sender?.avatar || '?'}
                          size={32}
                          colorIndex={colorIndex}
                        />
                      )}
                    </div>

                    <div style={{ maxWidth: '65%' }}>
                      {showAvatar && !isMe && (
                        <p
                          style={{
                            margin: '0 0 4px 4px',
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.4)',
                          }}
                        >
                          {sender?.name || 'Unknown'}
                          {sender?.role === 'teacher' && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 10,
                                color: '#a5b4fc',
                                background: 'rgba(99,102,241,0.15)',
                                padding: '1px 6px',
                                borderRadius: 8,
                              }}
                            >
                              Teacher
                            </span>
                          )}
                        </p>
                      )}
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: isMe
                            ? '16px 4px 16px 16px'
                            : '4px 16px 16px 16px',
                          background: isMe
                            ? 'rgba(99,102,241,0.22)'
                            : 'rgba(255,255,255,0.07)',
                          border: isMe
                            ? '1px solid rgba(99,102,241,0.3)'
                            : '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            color: '#e2e8f0',
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.text}
                        </p>
                      </div>
                      <p
                        style={{
                          margin: '4px 4px 0',
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.2)',
                          textAlign: isMe ? 'right' : 'left',
                        }}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              background: '#13151f',
              display: 'flex',
              gap: 10,
            }}
          >
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message… (Enter to send)"
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#0f1117',
                color: '#e2e8f0',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <Btn onClick={sendMessage} disabled={!message.trim()}>
              Send →
            </Btn>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <p style={{ fontSize: 48 }}>💬</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>
            {myRooms.length === 0
              ? 'No chatrooms available'
              : 'Select a chatroom to start chatting'}
          </p>
          {isTeacher && myRooms.length === 0 && (
            <Btn onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}>
              + Create Chatroom
            </Btn>
          )}
        </div>
      )}

      {/* Create room modal */}
      {showCreate && (
        <Modal title="Create Chatroom" onClose={() => setShowCreate(false)}>
          <Input
            label="Room Name *"
            value={newRoom.name}
            onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
            placeholder="e.g. DSA Doubts"
          />
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 6,
              }}
            >
              Class *
            </label>
            <select
              value={newRoom.classId}
              onChange={(e) => setNewRoom({ ...newRoom, classId: e.target.value })}
              style={selectStyle}
            >
              <option value="">Select class</option>
              {myClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Btn onClick={createRoom}>Create Room</Btn>
        </Modal>
      )}
    </div>
  );
}
