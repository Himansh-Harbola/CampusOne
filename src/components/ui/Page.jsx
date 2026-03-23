export default function Page({ title, subtitle, actions, children }) {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.15, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '0.01em' }}>{title}</h1>
          {subtitle && <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 13.5, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}
