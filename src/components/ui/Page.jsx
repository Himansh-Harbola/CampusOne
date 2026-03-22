export default function Page({ title, subtitle, actions, children }) {
  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 28,
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#f1f5f9' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>
        )}
      </div>
      {children}
    </div>
  );
}
