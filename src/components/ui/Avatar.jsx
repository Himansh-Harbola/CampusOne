const AVATAR_COLORS = [
  '#4F46E5','#0891B2','#059669','#D97706',
  '#DC2626','#7C3AED','#DB2777','#0284C7',
];

export default function Avatar({ initials = '?', size = 36, colorIndex = 0 }) {
  const bg = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.36,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
}
