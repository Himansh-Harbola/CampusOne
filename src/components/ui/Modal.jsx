export default function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, backdropFilter: 'blur(4px)', padding: 16,
      }}
    >
      <div style={{
        background: 'var(--bg-modal)',
        border: '1px solid var(--border-dim)',
        borderRadius: 'var(--radius-xl)',
        width: wide ? 700 : 540,
        maxWidth: '100%', maxHeight: '90vh', overflow: 'auto',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid var(--border-dim)',
          position: 'sticky', top: 0,
          background: 'var(--bg-modal)', zIndex: 1,
        }}>
          <h2 style={{
            margin: 0, fontSize: 22,
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            letterSpacing: '0.01em',
          }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: 'var(--text-muted)', fontSize: 22,
            cursor: 'pointer', lineHeight: 1,
            padding: '2px 8px', borderRadius: 6,
          }}>×</button>
        </div>
        <div style={{ padding: '26px 28px' }}>{children}</div>
      </div>
    </div>
  );
}
