export default function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: '#1a1d2e',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '20px 24px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
