export default function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#1a1d2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          width: wide ? 680 : 540,
          maxWidth: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            position: 'sticky',
            top: 0,
            background: '#1a1d2e',
            zIndex: 1,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '2px 6px',
              borderRadius: 6,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}
