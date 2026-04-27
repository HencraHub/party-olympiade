import { useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard.jsx";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo / hero */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="text-6xl mb-4">🏅</div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-3">
          <span
            style={{
              background: "linear-gradient(90deg, #8b5cf6, #ec4899, #22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Party
          </span>{" "}
          <span className="text-white">Olympiade</span>
        </h1>
        <p className="text-muted text-lg sm:text-xl max-w-md mx-auto">
          The ultimate gaming olympics tracker for you and your friends.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl animate-slide-up">
        <GlassCard
          glow
          className="flex flex-col items-center text-center gap-4"
        >
          <div className="text-5xl">🚀</div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Create Event</h2>
            <p className="text-sm text-muted">
              Build your olympic lineup, add players and their stats, launch the
              event.
            </p>
          </div>
          <button
            className="btn-primary w-full"
            onClick={() => navigate("/create")}
          >
            Start Building
          </button>
        </GlassCard>

        <GlassCard className="flex flex-col items-center text-center gap-4">
          <div className="text-5xl">🎮</div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Join Event</h2>
            <p className="text-sm text-muted">
              Have a room code? Jump in and follow the action live.
            </p>
          </div>
          <button
            className="btn-secondary w-full"
            onClick={() => navigate("/join")}
          >
            Enter Room
          </button>
        </GlassCard>
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl text-center animate-fade-in">
        {[
          { icon: "🏆", label: "Live Scores" },
          { icon: "📊", label: "Real-time Board" },
          { icon: "🎉", label: "Epic Podium" },
          { icon: "⚡", label: "Instant Sync" },
        ].map(({ icon, label }) => (
          <div key={label} className="glass rounded-xl p-4">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xs font-semibold text-muted">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
