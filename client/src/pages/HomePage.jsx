import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    icon: "🎲",
    title: "Verrückte Spiele",
    desc: "Von Klassikern bis zu neuen Party-Highlights. Für jeden ist etwas dabei!",
    color: "from-pink-500/20 to-purple-500/10",
    border: "border-pink-500/30",
    glow: "rgba(236,72,153,0.15)",
  },
  {
    icon: "👥",
    title: "Für alle gemacht",
    desc: "Egal ob 3 oder 20 Spieler – stellt Teams zusammen und habt gemeinsam Spaß!",
    color: "from-cyan-500/20 to-blue-500/10",
    border: "border-cyan-500/30",
    glow: "rgba(34,211,238,0.15)",
  },
  {
    icon: "👑",
    title: "Punkte sammeln",
    desc: "Jedes Spiel zählt! Sammelt Punkte und steigt im Ranking auf.",
    color: "from-yellow-500/20 to-orange-500/10",
    border: "border-yellow-500/30",
    glow: "rgba(250,204,21,0.15)",
  },
  {
    icon: "⚡",
    title: "Einfache Regeln",
    desc: "Schnell verstanden, sofort losgespielt. Kein Aufwand, nur Spaß!",
    color: "from-purple-500/20 to-pink-500/10",
    border: "border-purple-500/30",
    glow: "rgba(139,92,246,0.15)",
  },
  {
    icon: "🏆",
    title: "Werde Champion",
    desc: "Zeig allen, wer die Olympiade dominiert und sich den Sieg holt!",
    color: "from-green-500/20 to-cyan-500/10",
    border: "border-green-500/30",
    glow: "rgba(34,197,94,0.15)",
  },
];

const STEPS = [
  {
    num: "1",
    icon: "👥",
    title: "Lobby erstellen",
    desc: "Erstelle deine Lobby und lade deine Freunde ein.",
    color: "#ec4899",
  },
  {
    num: "2",
    icon: "🎮",
    title: "Spiele auswählen",
    desc: "Wählt zusammen die besten Spiele für eure Olympiade.",
    color: "#22d3ee",
  },
  {
    num: "3",
    icon: "🏆",
    title: "Spielen & Punkten",
    desc: "Spielt die Spiele und sammelt Punkte!",
    color: "#8b5cf6",
  },
  {
    num: "4",
    icon: "👑",
    title: "Champion küren",
    desc: "Wer hat die meisten Punkte? Die Krone gehört dir!",
    color: "#facc15",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-56px)] flex items-center px-6 sm:px-12 lg:px-20 py-16">
        {/* Decorative neon rings */}
        <div
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full opacity-30 hidden lg:block"
          style={{
            background:
              "radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(139,92,246,0.15) 40%, transparent 70%)",
            boxShadow:
              "0 0 120px 40px rgba(236,72,153,0.12), inset 0 0 80px rgba(139,92,246,0.08)",
          }}
        />
        <div
          className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full opacity-20 hidden lg:block"
          style={{
            border: "2px solid rgba(236,72,153,0.4)",
            boxShadow:
              "0 0 60px rgba(236,72,153,0.2), inset 0 0 60px rgba(236,72,153,0.1)",
          }}
        />
        <div
          className="pointer-events-none absolute right-28 top-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full opacity-15 hidden lg:block"
          style={{
            border: "2px solid rgba(139,92,246,0.5)",
          }}
        />

        <div className="relative z-10 max-w-2xl animate-slide-up">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-pink-500/40 bg-pink-500/10 text-pink-300 text-xs font-bold uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            Die ultimative Party Challenge
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            <span className="text-white">SPIELE. PUNKTE.</span>
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #22d3ee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              WERDE CHAMPION.
            </span>
          </h1>

          <p className="text-white/60 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg">
            Stellt euch in verrückten Spielen, sammelt Punkte und kämpft um die Krone der Party Olympiade!
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              className="btn-primary !px-8 !py-4 !rounded-2xl text-base gap-3 shadow-[0_0_40px_rgba(236,72,153,0.3)]"
              onClick={() => navigate("/create")}
            >
              <span className="text-lg">+</span>
              <div className="text-left">
                <div className="font-black">Lobby erstellen</div>
                <div className="text-xs font-normal opacity-70">Neue Olympiade starten</div>
              </div>
            </button>
            <button
              className="btn-secondary !px-8 !py-4 !rounded-2xl text-base gap-3 !border-cyan-500/60 !text-cyan-300 hover:!bg-cyan-500/10"
              onClick={() => navigate("/join")}
            >
              <span className="text-lg">👥</span>
              <div className="text-left">
                <div className="font-black">Lobby beitreten</div>
                <div className="text-xs font-normal opacity-70">Mit Code beitreten</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ── WHY SECTION ─────────────────────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-20 py-20">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40 mb-3">
            Warum Party Olympiade?
          </h2>
          <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {FEATURES.map(({ icon, title, desc, color, border, glow }) => (
            <div
              key={title}
              className={`relative rounded-2xl p-5 border bg-gradient-to-br ${color} ${border} flex flex-col items-center text-center gap-3 transition-transform duration-200 hover:scale-105 hover:-translate-y-1`}
              style={{ boxShadow: `0 8px 32px ${glow}` }}
            >
              <div className="text-4xl">{icon}</div>
              <div>
                <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-20 py-20">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40 mb-3">
            So funktioniert's
          </h2>
          <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto relative">
          {/* Connector line */}
          <div
            className="absolute top-8 left-[12.5%] right-[12.5%] h-px hidden lg:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(139,92,246,0.4) 20%, rgba(34,211,238,0.4) 50%, rgba(139,92,246,0.4) 80%, transparent)",
            }}
          />

          {STEPS.map(({ num, icon, title, desc, color }) => (
            <div
              key={num}
              className="relative flex flex-col items-center text-center gap-3 glass rounded-2xl p-5 border-white/[0.08]"
            >
              {/* Step circle */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl border-2 relative z-10"
                style={{
                  borderColor: color,
                  background: `${color}22`,
                  color,
                  boxShadow: `0 0 20px ${color}44`,
                }}
              >
                {num}
              </div>
              <div className="text-2xl">{icon}</div>
              <div>
                <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────── */}
      <section className="px-6 sm:px-12 lg:px-20 py-20 text-center">
        <div
          className="max-w-2xl mx-auto rounded-3xl p-10 border border-purple-500/20 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))",
            boxShadow: "0 0 80px rgba(139,92,246,0.1)",
          }}
        >
          {/* Background glow blobs */}
          <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-pink-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="text-5xl mb-4">🏅</div>
            <h2 className="text-3xl font-black text-white mb-3">
              Bereit für die{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Olympiade?
              </span>
            </h2>
            <p className="text-white/50 mb-8 max-w-sm mx-auto">
              Starte jetzt dein Event und finde heraus, wer der wahre Champion ist.
            </p>
            <button
              className="btn-primary !px-10 !py-4 !rounded-2xl text-base shadow-[0_0_40px_rgba(139,92,246,0.4)]"
              onClick={() => navigate("/create")}
            >
              🚀 Jetzt starten
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

