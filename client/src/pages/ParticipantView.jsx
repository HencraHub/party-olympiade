import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { connectSocket, getSocket } from "../socket/socket.js";
import useOlympicStore from "../store/useOlympicStore.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Scoreboard from "../components/Scoreboard.jsx";

export default function ParticipantView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const {
    olympic,
    leaderboard,
    participantName,
    updateFromRoomEvent,
    setConnected,
  } = useOlympicStore();
  const [joined, setJoined] = useState(!!olympic);
  const [socketError, setSocketError] = useState("");
  const [rulesModal, setRulesModal] = useState(null); // game object or null

  useEffect(() => {
    if (!code) return;

    // If we already have an olympic in store (came from JoinPage), just listen for updates
    const socket = connectSocket();

    socket.on("room-update", (data) => {
      updateFromRoomEvent(data);
      setConnected(true);
      setJoined(true);
    });

    socket.on("olympic-finished", () => {
      navigate(`/room/${code}/winner`);
    });

    socket.on("olympic-reverted", () => {
      // Host reverted to draft — send players back to join page with a message
      navigate(`/join/${code?.toUpperCase()}?reverted=1`);
    });

    socket.on("kicked", () => {
      navigate(`/join/${code?.toUpperCase()}?kicked=1`);
    });

    socket.on("error", ({ message }) => setSocketError(message));

    // If we don't have an olympic yet (direct URL access), try to join as spectator
    if (!olympic) {
      socket.emit("join-room", {
        code: code.toUpperCase(),
        name: participantName || "Guest",
        isHost: false,
      });
    }

    return () => {
      socket.off("room-update");
      socket.off("olympic-finished");
      socket.off("olympic-reverted");
      socket.off("kicked");
      socket.off("error");
    };
  }, [code]);

  if (!olympic || !joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-muted animate-pulse text-center">
          {socketError || `Connecting to room ${code}…`}
        </div>
        {socketError && (
          <button
            className="btn-secondary"
            onClick={() => navigate(`/join/${code}`)}
          >
            Try joining again
          </button>
        )}
      </div>
    );
  }

  // ── Lobby waiting room ──────────────────────────────────────────────────
  if (olympic.status === "lobby") {
    const playerCount = olympic.participants.length;
    const maxPlayers = olympic.maxPlayers || 20;

    const avatarGradients = [
      "from-pink-500 to-purple-600",
      "from-purple-500 to-blue-600",
      "from-cyan-500 to-blue-500",
      "from-green-400 to-teal-500",
      "from-orange-400 to-pink-500",
      "from-yellow-400 to-orange-500",
      "from-rose-400 to-pink-600",
      "from-indigo-400 to-purple-500",
    ];

    return (
      <div className="min-h-screen px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-lg space-y-6 animate-slide-up">
          {/* ── Waiting hero card ── */}
          <div
            className="relative rounded-2xl p-6 overflow-hidden text-center"
            style={{
              background:
                "linear-gradient(145deg, rgba(10,10,28,0.97), rgba(16,14,40,0.97))",
              border: "1px solid rgba(139,92,246,0.45)",
              boxShadow: "0 0 60px rgba(139,92,246,0.15)",
            }}
          >
            {/* Ambient decorative dots */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-sm"
                  style={{
                    left: `${8 + i * 12}%`,
                    top: `${12 + (i % 3) * 30}%`,
                    background: ["#ec4899", "#8b5cf6", "#22d3ee", "#facc15"][
                      i % 4
                    ],
                    opacity: 0.5,
                    transform: `rotate(${i * 45}deg)`,
                  }}
                />
              ))}
            </div>

            <div className="relative">
              {/* Hourglass icon */}
              <div className="flex justify-center mb-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.15))",
                    border: "1px solid rgba(139,92,246,0.35)",
                  }}
                >
                  ⏳
                </div>
              </div>

              <h2 className="text-xl font-black text-white mb-1">
                {olympic.name}
              </h2>
              <p className="text-white/45 text-sm mb-5 animate-pulse">
                Warte darauf, dass der Host das Spiel startet…
              </p>

              {/* Separator */}
              <div className="h-px bg-white/[0.06] mb-4" />

              {/* Joined confirmation */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-purple-400">👥</span>
                <span className="font-bold text-white text-sm">
                  Du bist in der Lobby
                </span>
              </div>
              {participantName && (
                <p className="text-white/40 text-xs mt-1">
                  Der Host kann Spiele und Regeln ändern.
                </p>
              )}
            </div>
          </div>

          {/* ── Player grid ── */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "rgba(10,12,30,0.9)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-purple-400">🎮</span>
                <h2 className="font-black text-white text-sm uppercase tracking-wider">
                  Spieler in der Lobby
                </h2>
              </div>
              <span className="text-sm text-muted">
                <span className="text-white font-bold">{playerCount}</span> /{" "}
                {maxPlayers} Spieler
              </span>
            </div>

            <div className="flex flex-wrap gap-4">
              {olympic.participants.map((p, i) => {
                const isMe = p.name === participantName;
                const isHost = i === 0;
                return (
                  <div
                    key={p.name}
                    className="flex flex-col items-center gap-1.5 animate-fade-in"
                  >
                    <div className="relative">
                      <div
                        className={`w-[70px] h-[70px] rounded-2xl bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center font-black text-xl text-white`}
                        style={{
                          border: isMe
                            ? "2px solid rgba(236,72,153,0.7)"
                            : "2px solid rgba(255,255,255,0.1)",
                          boxShadow: isMe
                            ? "0 0 14px rgba(236,72,153,0.3)"
                            : "none",
                        }}
                      >
                        {p.name[0]?.toUpperCase()}
                      </div>
                      {isHost && (
                        <span className="absolute -top-2 -right-1 text-base">
                          👑
                        </span>
                      )}
                      {/* Online dot */}
                      <span
                        className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2"
                        style={{
                          background: "#22c55e",
                          borderColor: "#0a0c1e",
                        }}
                      />
                    </div>
                    <span className="text-white text-xs font-semibold max-w-[72px] truncate text-center">
                      {p.name}
                    </span>
                    {isMe && (
                      <span
                        className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(236,72,153,0.2)",
                          border: "1px solid rgba(236,72,153,0.4)",
                          color: "#f472b6",
                        }}
                      >
                        Du
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Empty slots */}
              {Array.from({
                length: Math.min(maxPlayers - playerCount, 8),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className="w-[70px] h-[70px] rounded-2xl flex items-center justify-center text-white/20 text-2xl"
                    style={{
                      border: "2px dashed rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.025)",
                    }}
                  >
                    +
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Hint card ── */}
          <div
            className="rounded-2xl px-5 py-4 flex items-start gap-4"
            style={{
              background: "rgba(10,12,30,0.9)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: "rgba(34,211,238,0.1)",
                border: "1px solid rgba(34,211,238,0.3)",
              }}
            >
              <span className="text-cyan-400 text-sm">ℹ</span>
            </div>
            <div>
              <h3 className="font-black text-cyan-400 text-sm mb-1">Hinweis</h3>
              <p className="text-white/50 text-xs leading-relaxed">
                Warte hier, bis der Host das Spiel startet.
                <br />
                Nur der Host kann Spiele und Regeln ändern.
              </p>
            </div>
          </div>

          {/* ── Leave button ── */}
          <button
            className="w-full py-3 rounded-full font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
            style={{
              background: "rgba(236,72,153,0.1)",
              border: "1.5px solid rgba(236,72,153,0.5)",
              color: "#f472b6",
              boxShadow: "0 0 20px rgba(236,72,153,0.12)",
            }}
            onClick={() => navigate("/")}
          >
            ← Lobby verlassen
          </button>
        </div>
      </div>
    );
  }

  const currentGame = olympic.games[olympic.currentGameIndex];
  const totalGames = olympic.games.length;
  const scoredCount = olympic.results.length;
  const progress =
    totalGames > 0 ? Math.round((scoredCount / totalGames) * 100) : 0;

  return (
    <>
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* ── Header bar ── */}
          <div
            className="flex items-center justify-between gap-4 rounded-2xl px-6 py-4"
            style={{
              background: "rgba(10,12,30,0.95)",
              border: "1px solid rgba(139,92,246,0.35)",
              boxShadow: "0 0 30px rgba(139,92,246,0.1)",
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">🏅</span>
              <div className="min-w-0">
                <h1 className="font-black text-white text-lg truncate leading-tight">
                  {olympic.name}
                </h1>
                {participantName && (
                  <p className="text-xs text-white/40 mt-0.5">
                    Du spielst als{" "}
                    <span className="text-purple-300 font-semibold">
                      {participantName}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Progress (desktop) */}
            <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="text-xs text-white/30">
                {scoredCount} / {totalGames} bewertet
              </span>
              <div className="w-32 h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
                    boxShadow: "0 0 8px rgba(236,72,153,0.5)",
                  }}
                />
              </div>
            </div>

            <span className="text-sm font-mono text-yellow-400 tracking-widest flex-shrink-0">
              {code?.toUpperCase()}
            </span>
          </div>

          {/* ── Progress bar (mobile) ── */}
          <div
            className="sm:hidden rounded-xl px-4 py-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex justify-between text-xs text-white/35 mb-2">
              <span>Fortschritt</span>
              <span>
                {scoredCount} / {totalGames}
              </span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
                }}
              />
            </div>
          </div>

          {/* ── Two-column: 2/3 game | 1/3 scoreboard ── */}
          <div className="grid lg:grid-cols-[2fr_1fr] gap-5 items-start">
            {/* ── Left 2/3: current game ── */}
            <div className="space-y-4">
              {currentGame ? (
                <div
                  className="rounded-2xl p-7"
                  style={{
                    background: "rgba(10,12,30,0.97)",
                    border: "1px solid rgba(139,92,246,0.4)",
                    boxShadow: "0 0 50px rgba(139,92,246,0.12)",
                  }}
                >
                  {/* Game identity */}
                  <div className="flex items-start gap-5 mb-6">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.12))",
                        border: "1px solid rgba(139,92,246,0.32)",
                      }}
                    >
                      {currentGame.icon}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1.5">
                        Spiel {olympic.currentGameIndex + 1} von {totalGames}
                      </p>
                      <h2 className="text-3xl font-black text-white leading-tight mb-2">
                        {currentGame.title}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-block text-xs font-black uppercase px-3 py-1 rounded-full"
                          style={{
                            background:
                              currentGame.mode === "team"
                                ? "rgba(139,92,246,0.2)"
                                : "rgba(236,72,153,0.2)",
                            color:
                              currentGame.mode === "team"
                                ? "#a78bfa"
                                : "#f472b6",
                            border: `1px solid ${currentGame.mode === "team" ? "rgba(139,92,246,0.4)" : "rgba(236,72,153,0.4)"}`,
                          }}
                        >
                          {currentGame.mode === "team" ? "👥 Teams" : "⚔ FFA"}
                        </span>
                        {olympic.results.find(
                          (r) => String(r.gameId) === String(currentGame._id),
                        ) && (
                          <span className="text-green-400 text-sm font-bold">
                            ✅ Bewertet
                          </span>
                        )}
                        <span
                          className="inline-flex items-center gap-1 text-xs font-black uppercase px-3 py-1 rounded-full"
                          style={{
                            background: "rgba(250,204,21,0.12)",
                            border: "1px solid rgba(250,204,21,0.3)",
                            color: "#facc15",
                          }}
                        >
                          ▶ Live
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rules */}
                  {currentGame.rules && (
                    <div
                      className="rounded-xl p-5 mb-4"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 mb-2">
                        Regeln
                      </p>
                      <p className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                        {currentGame.rules}
                      </p>
                    </div>
                  )}

                  {/* Drinking rules */}
                  {currentGame.addons?.drinkingGame?.enabled && (
                    <div
                      className="rounded-xl p-5 mb-4"
                      style={{
                        background: "rgba(251,146,60,0.06)",
                        border: "1px solid rgba(251,146,60,0.25)",
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400/70 mb-2">
                        🍺 Trinkregeln
                      </p>
                      <p className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                        {currentGame.addons.drinkingGame.rules ||
                          "Aktiviert — frag den Host nach den Regeln."}
                      </p>
                    </div>
                  )}

                  {/* Equipment / handicap / time limit */}
                  {(currentGame.addons?.equipment ||
                    currentGame.addons?.handicap ||
                    currentGame.addons?.timeLimit > 0) && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {currentGame.addons?.timeLimit > 0 && (
                        <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8">
                          ⏱ {currentGame.addons.timeLimit} Min
                        </span>
                      )}
                      {currentGame.addons?.equipment && (
                        <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8">
                          🎒 {currentGame.addons.equipment}
                        </span>
                      )}
                      {currentGame.addons?.handicap && (
                        <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8">
                          ⚖ {currentGame.addons.handicap}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="rounded-2xl p-10 text-center"
                  style={{
                    background: "rgba(10,12,30,0.9)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p className="text-white/30">Kein Spiel ausgewählt</p>
                </div>
              )}
            </div>

            {/* ── Right 1/3: leaderboard + spielplan (sticky) ── */}
            <div className="lg:sticky lg:top-6 space-y-4">
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(10,12,30,0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4">
                  📊 Live Tabelle
                </p>
                <Scoreboard
                  leaderboard={leaderboard}
                  participants={olympic.participants}
                  myName={participantName}
                />
              </div>

              {/* Spielplan */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(10,12,30,0.9)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
                    Spielplan
                  </p>
                  <span className="text-[10px] text-white/25">
                    {olympic.games.length} Spiele
                  </span>
                </div>
                <div className="space-y-1.5">
                  {olympic.games.map((g, i) => {
                    const scored = !!olympic.results.find(
                      (r) => String(r.gameId) === String(g._id),
                    );
                    const isCur = i === olympic.currentGameIndex;
                    const hidden = olympic.hideGamePlan && !isCur && !scored;
                    return (
                      <div
                        key={String(g._id)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={
                          isCur
                            ? {
                                background: "rgba(139,92,246,0.15)",
                                border: "1px solid rgba(139,92,246,0.35)",
                              }
                            : {
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid transparent",
                              }
                        }
                      >
                        <span
                          className="text-xs font-black w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isCur
                              ? "rgba(139,92,246,0.4)"
                              : "rgba(255,255,255,0.05)",
                            color: isCur ? "#c4b5fd" : "#555",
                          }}
                        >
                          {i + 1}
                        </span>
                        {/* Icon — always visible */}
                        <span className="text-sm flex-shrink-0">
                          {hidden ? "🎮" : g.icon}
                        </span>
                        {/* Title — blurred when hidden */}
                        <span
                          className={`flex-1 text-xs font-semibold truncate select-none ${isCur ? "text-white" : "text-white/45"}`}
                          style={
                            hidden
                              ? { filter: "blur(5px)", pointerEvents: "none" }
                              : undefined
                          }
                        >
                          {hidden ? "???????????" : g.title}
                        </span>
                        {scored && !hidden && (
                          <span className="text-green-400 text-xs flex-shrink-0">
                            ✅
                          </span>
                        )}
                        {isCur && (
                          <span className="text-yellow-400 text-[9px] font-black uppercase flex-shrink-0">
                            ▶
                          </span>
                        )}
                        {/* Rules button — visible when not hidden */}
                        {!hidden &&
                          (g.rules ||
                            g.addons?.drinkingGame?.enabled ||
                            g.addons?.equipment ||
                            g.addons?.handicap) && (
                            <button
                              className="text-white/25 hover:text-purple-400 text-xs flex-shrink-0 transition-colors leading-none px-1"
                              onClick={() => setRulesModal(g)}
                              title="Regeln anzeigen"
                            >
                              ℹ
                            </button>
                          )}
                      </div>
                    );
                  })}
                </div>
                {olympic.hideGamePlan && (
                  <p className="text-[10px] text-white/20 text-center mt-3">
                    🔒 Spielplan ausgeblendet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {rulesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setRulesModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{
              background: "rgba(12,10,30,0.98)",
              border: "1px solid rgba(139,92,246,0.3)",
              boxShadow: "0 0 40px rgba(139,92,246,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">{rulesModal.icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-black text-white text-lg leading-tight truncate">
                  {rulesModal.title}
                </h2>
                <span
                  className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded mt-0.5"
                  style={{
                    background:
                      rulesModal.mode === "team"
                        ? "rgba(139,92,246,0.2)"
                        : "rgba(236,72,153,0.2)",
                    color: rulesModal.mode === "team" ? "#a78bfa" : "#f472b6",
                  }}
                >
                  {rulesModal.mode === "team" ? "👥 Teams" : "⚔ FFA"}
                </span>
              </div>
              <button
                className="text-white/40 hover:text-white text-xl leading-none flex-shrink-0"
                onClick={() => setRulesModal(null)}
              >
                ✕
              </button>
            </div>

            {/* Rules text */}
            {rulesModal.rules && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 mb-2">
                  Regeln
                </p>
                <p className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                  {rulesModal.rules}
                </p>
              </div>
            )}

            {/* Drinking rules */}
            {rulesModal.addons?.drinkingGame?.enabled && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(251,146,60,0.06)",
                  border: "1px solid rgba(251,146,60,0.25)",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400/70 mb-2">
                  🍺 Trinkregeln
                </p>
                <p className="text-sm text-white/85 whitespace-pre-line leading-relaxed">
                  {rulesModal.addons.drinkingGame.rules ||
                    "Aktiviert — frag den Host nach den Regeln."}
                </p>
              </div>
            )}

            {/* Equipment / handicap / time */}
            {(rulesModal.addons?.equipment ||
              rulesModal.addons?.handicap ||
              rulesModal.addons?.timeLimit > 0) && (
              <div className="flex flex-wrap gap-2">
                {rulesModal.addons?.timeLimit > 0 && (
                  <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8">
                    ⏱ {rulesModal.addons.timeLimit} Min
                  </span>
                )}
                {rulesModal.addons?.equipment && (
                  <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8">
                    🎒 {rulesModal.addons.equipment}
                  </span>
                )}
                {rulesModal.addons?.handicap && (
                  <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8">
                    ⚖ {rulesModal.addons.handicap}
                  </span>
                )}
              </div>
            )}

            <button
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => setRulesModal(null)}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </>
  );
}
