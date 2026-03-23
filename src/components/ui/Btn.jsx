const VARIANTS = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    hoverBg: 'var(--accent-hover)',
  },
  secondary: {
    background: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-subtle)',
    hoverBg: 'var(--bg-elevated)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-dim)',
    hoverBg: 'var(--bg-elevated)',
  },
  danger: {
    background: 'var(--danger-bg)',
    color: 'var(--danger)',
    border: '1px solid var(--danger)',
    hoverBg: 'var(--danger-bg)',
  },
  success: {
    background: 'var(--success-bg)',
    color: 'var(--success)',
    border: '1px solid var(--success)',
    hoverBg: 'var(--success-bg)',
  },
};

export default function Btn({ children, onClick, variant = 'primary', small = false, disabled = false, style = {} }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? '6px 14px' : '9px 22px',
        borderRadius: 'var(--radius-md)',
        fontSize: small ? 12.5 : 13.5,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.15s, opacity 0.15s',
        letterSpacing: '0.01em',
        background: v.background,
        color: v.color,
        border: v.border || 'none',
        boxShadow: variant === 'primary' ? 'var(--shadow-sm)' : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
