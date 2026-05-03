export default function GlassCard({ children, className = "", glow = false }) {
  return (
    <div
      className={`glass rounded-2xl p-6 ${glow ? "shadow-[0_0_40px_rgba(139,92,246,0.15)]" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
