export default function Input({ label, style = {}, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
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
          transition: 'border-color 0.15s',
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgba(99,102,241,0.6)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255,255,255,0.12)';
          props.onBlur?.(e);
        }}
      />
    </div>
  );
}
