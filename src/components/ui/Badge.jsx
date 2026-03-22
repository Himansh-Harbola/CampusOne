export default function Badge({
  children,
  color = 'rgba(99,102,241,0.18)',
  textColor = '#a5b4fc',
}) {
  return (
    <span
      style={{
        padding: '3px 10px',
        borderRadius: 20,
        background: color,
        color: textColor,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
