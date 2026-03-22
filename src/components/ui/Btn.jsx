const VARIANTS = {
  primary: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'rgba(255,255,255,0.07)',
    color: '#e2e8f0',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  danger: {
    background: 'rgba(239,68,68,0.15)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.3)',
  },
  success: {
    background: 'rgba(16,185,129,0.15)',
    color: '#34d399',
    border: '1px solid rgba(16,185,129,0.3)',
  },
};

export default function Btn({
  children,
  onClick,
  variant = 'primary',
  small = false,
  disabled = false,
  style = {},
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? '6px 14px' : '9px 20px',
        borderRadius: 9,
        fontSize: small ? 13 : 14,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s',
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
