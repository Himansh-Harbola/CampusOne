const PRESETS = {
  default: { bg: 'var(--accent-light)',  text: 'var(--accent-text)'  },
  success: { bg: 'var(--success-bg)',    text: 'var(--success)'      },
  warning: { bg: 'var(--warning-bg)',    text: 'var(--warning)'      },
  danger:  { bg: 'var(--danger-bg)',     text: 'var(--danger)'       },
  info:    { bg: 'var(--info-bg)',       text: 'var(--info)'         },
  muted:   { bg: 'var(--bg-elevated)',   text: 'var(--text-muted)'   },
};

export default function Badge({ children, variant = 'default', color, textColor }) {
  const preset = PRESETS[variant] || PRESETS.default;
  return (
    <span style={{
      padding: '3px 11px',
      borderRadius: 20,
      background: color || preset.bg,
      color: textColor || preset.text,
      fontSize: 11.5,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
      fontFamily: 'var(--font-body)',
    }}>
      {children}
    </span>
  );
}
