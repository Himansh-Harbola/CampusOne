export default function StatCard({ label, value, icon, color = '#6366f1' }) {
  return (
    <div
      style={{
        background: '#1a1d2e',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: color + '22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          {icon}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#f1f5f9' }}>
        {value}
      </p>
    </div>
  );
}
