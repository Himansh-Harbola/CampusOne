export default function Input({ label, style = {}, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{
          display: 'block', fontSize: 12, fontWeight: 600,
          color: 'var(--text-muted)', marginBottom: 6,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          fontFamily: 'var(--font-body)',
        }}>
          {label}
        </label>
      )}
      <input {...props} style={{
        width: '100%', padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-input)',
        color: 'var(--text-primary)',
        fontSize: 14, outline: 'none',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-body)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...style,
      }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent)';
          e.target.style.boxShadow = '0 0 0 3px rgba(201,125,46,0.12)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-subtle)';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
      />
    </div>
  );
}
