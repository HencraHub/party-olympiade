import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { connectSocket, getSocket } from "../socket/socket.js";
import useOlympicStore from "../store/useOlympicStore.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import GameCard from "../components/GameCard.jsx";
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
  const [tab, setTab] = useState("game");
  const [socketError, setSocketError] = useState("");

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
        <div className="w-full max-w-lg space-y-4 animate-slide-up">
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
            className="rounded-2xl p-5"
            style={{
              background: "rgba(10,12,30,0.9)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
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

            <div className="flex flex-wrap gap-3">
              {olympic.participants.map((p, i) => {
                const isMe = p.name === participantName;
                const isHost = i === 0;
                return (
                  <div
                    key={p.name}
                    className="flex flex-col items-center gap-1 animate-fade-in"
                  >
                    <div className="relative">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center font-black text-lg text-white`}
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
                        className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2"
                        style={{
                          background: "#22c55e",
                          borderColor: "#0a0c1e",
                        }}
                      />
                    </div>
                    <span className="text-white text-xs font-semibold max-w-[56px] truncate text-center">
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
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white/20 text-lg"
                    style={{
                      border: "2px dashed rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.02)",
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
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <GlassCard className="text-center py-4">
          <div className="text-3xl mb-1">🏅</div>
          <h1 className="font-black text-white text-xl">{olympic.name}</h1>
          {participantName && (
            <p className="text-sm text-muted mt-1">
              You're in as{" "}
              <span className="text-purple-light font-semibold">
                {participantName}
              </span>
            </p>
          )}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-yellow-400 font-mono font-bold tracking-widest">
              {code?.toUpperCase()}
            </span>
          </div>
        </GlassCard>

        {/* Progress */}
        <div className="glass rounded-xl px-4 py-3">
          <div className="flex justify-between text-xs text-muted mb-1.5">
            <span>Progress</span>
            <span>
              {scoredCount}/{totalGames} games
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 glass rounded-xl p-1">
          {[
            { key: "game", label: "▶ Current Game" },
            { key: "board", label: "📊 Leaderboard" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key
                  ? "bg-purple-500/30 text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Game */}
        {tab === "game" && (
          <div className="space-y-4 animate-fade-in">
            {currentGame ? (
              <>
                <GameCard
                  game={currentGame}
                  isCurrent
                  isScored={
                    !!olympic.results.find(
                      (r) => String(r.gameId) === String(currentGame._id),
                    )
                  }
                />

                {currentGame.rules && (
                  <GlassCard>
                    <h3 className="text-sm font-semibold text-muted mb-2">
                      Rules
                    </h3>
                    <p className="text-sm text-white whitespace-pre-line">
                      {currentGame.rules}
                    </p>
                  </GlassCard>
                )}

                {currentGame.addons?.drinkingGame?.enabled && (
                  <GlassCard className="border-orange-500/30">
                    <h3 className="text-sm font-semibold text-orange-400 mb-1">
                      🍺 Drinking Rules
                    </h3>
                    <p className="text-sm text-white whitespace-pre-line">
                      {currentGame.addons.drinkingGame.rules ||
                        "Enabled — ask the host for rules."}
                    </p>
                  </GlassCard>
                )}

                <div className="text-center text-sm text-muted">
                  Game {olympic.currentGameIndex + 1} of {totalGames}
                </div>
              </>
            ) : (
              <GlassCard className="text-center py-8">
                <p className="text-muted">No games available.</p>
              </GlassCard>
            )}
          </div>
        )}

        {/* Tab: Leaderboard */}
        {tab === "board" && (
          <GlassCard className="animate-fade-in">
            <h2 className="font-bold text-white mb-4">Live Leaderboard</h2>
            <Scoreboard
              leaderboard={leaderboard}
              participants={olympic.participants}
              myName={participantName}
            />
          </GlassCard>
        )}
      </div>
    </div>
  );
}
