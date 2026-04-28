import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { connectSocket, getSocket } from "../socket/socket.js";
import useOlympicStore from "../store/useOlympicStore.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Select from "../components/ui/Select.jsx";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import GameCard from "../components/GameCard.jsx";
import Scoreboard from "../components/Scoreboard.jsx";
import ScoreEntry from "../components/ScoreEntry.jsx";

export default function HostRoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { olympic, leaderboard, updateFromRoomEvent, setConnected } =
    useOlympicStore();

  const [tab, setTab] = useState("game"); // 'game' | 'score' | 'board' | 'players' | 'manage'
  const [scoreGame, setScoreGame] = useState(null); // game being scored
  const [socketError, setSocketError] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, confirmLabel, danger, onConfirm }
  const [managingGames, setManagingGames] = useState(null); // local copy of games for drag-free reorder

  const hostToken = localStorage.getItem(`hostToken_${code?.toUpperCase()}`);

  // Connect & join room
  useEffect(() => {
    if (!code) return;
    if (!hostToken) {
      navigate("/");
      return;
    }

    const socket = connectSocket();

    socket.on("room-update", (data) => {
      updateFromRoomEvent(data);
      setConnected(true);
    });

    socket.on("olympic-finished", () => {
      navigate(`/room/${code}/winner`);
    });

    socket.on("olympic-reverted", () => {
      navigate(`/edit/${code?.toUpperCase()}`);
    });

    socket.on("error", ({ message }) => setSocketError(message));

    socket.emit("join-room", {
      code: code.toUpperCase(),
      name: "Host",
      isHost: true,
      hostToken,
    });

    return () => {
      socket.off("room-update");
      socket.off("olympic-finished");
      socket.off("olympic-reverted");
      socket.off("error");
    };
  }, [code]);

  function navigate_game(direction) {
    const socket = getSocket();
    socket.emit("navigate", { code: code.toUpperCase(), direction, hostToken });
  }

  function startOlympic() {
    setStarting(true);
    const socket = getSocket();
    socket.emit("start-olympic", { code: code.toUpperCase(), hostToken });
  }

  function revertToDraft() {
    setConfirmModal({
      title: "Revert to Draft?",
      message:
        "All players will be kicked from the lobby and the Olympic will return to draft status.",
      confirmLabel: "↩ Revert",
      danger: false,
      onConfirm: () => {
        setConfirmModal(null);
        setReverting(true);
        getSocket().emit("revert-to-draft", {
          code: code.toUpperCase(),
          hostToken,
        });
      },
    });
  }

  function submitScore(result) {
    const socket = getSocket();
    socket.emit("submit-score", {
      code: code.toUpperCase(),
      result,
      hostToken,
    });
    setScoreGame(null);
    setTab("board");
  }

  function finishOlympic() {
    setConfirmModal({
      title: "End the Olympic?",
      message: "This will reveal the final winner. This cannot be undone.",
      confirmLabel: "🏆 End Event",
      danger: true,
      onConfirm: () => {
        setConfirmModal(null);
        setFinishing(true);
        getSocket().emit("finish-olympic", {
          code: code.toUpperCase(),
          hostToken,
        });
      },
    });
  }

  if (!olympic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted animate-pulse">
          Connecting to room {code}…
        </div>
      </div>
    );
  }

  const currentGame = olympic.games[olympic.currentGameIndex];
  const totalGames = olympic.games.length;
  const scoredCount = olympic.results.length;
  const progress =
    totalGames > 0 ? Math.round((scoredCount / totalGames) * 100) : 0;
  const scoringEnabled = olympic.scoringEnabled !== false;

  const existingResult = scoreGame
    ? olympic.results.find((r) => String(r.gameId) === String(scoreGame._id))
    : null;

  // ── Lobby waiting room ──────────────────────────────────────────────────
  if (olympic.status === "lobby") {
    const inviteLink = `${window.location.origin}/join/${code?.toUpperCase()}`;
    const playerCount = olympic.participants.length;
    const maxPlayers = olympic.maxPlayers || 20;
    const canStart = playerCount >= 2;

    // Slot 0 is always reserved for the host
    const hostName = olympic.hostParticipates ? olympic.hostPlayerName : "Host";

    function kickPlayer(playerName) {
      getSocket().emit("kick-player", {
        code: code.toUpperCase(),
        hostToken,
        playerName,
      });
    }

    // Avatar colors per index
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
          {/* ── Room code hero card ── */}
          <div
            className="relative rounded-2xl p-6 overflow-hidden"
            style={{
              background:
                "linear-gradient(145deg, rgba(10,10,28,0.97), rgba(16,14,40,0.97))",
              border: "1px solid rgba(139,92,246,0.45)",
              boxShadow:
                "0 0 60px rgba(139,92,246,0.18), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            {/* Confetti dots decorative */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-sm"
                  style={{
                    left: `${10 + i * 9}%`,
                    top: `${15 + (i % 3) * 25}%`,
                    background: [
                      "#ec4899",
                      "#8b5cf6",
                      "#22d3ee",
                      "#facc15",
                      "#f472b6",
                    ][i % 5],
                    opacity: 0.6,
                    transform: `rotate(${i * 37}deg)`,
                  }}
                />
              ))}
            </div>

            <div className="relative text-center">
              {/* People icon */}
              <div className="flex justify-center mb-2">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.15))",
                    border: "1px solid rgba(139,92,246,0.35)",
                  }}
                >
                  👥
                </div>
              </div>

              <h1
                className="text-2xl font-black mb-1"
                style={{
                  background: "linear-gradient(90deg, #ec4899, #a78bfa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Lobby bereit
              </h1>
              <p className="text-white/55 text-sm mb-4">
                Teile den Code mit deinen Freunden, damit sie beitreten können.
              </p>

              {/* Room code */}
              <div
                className="text-7xl font-black tracking-[0.15em] mb-5 select-all"
                style={{
                  background: "linear-gradient(90deg, #facc15, #f59e0b)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "none",
                  filter: "drop-shadow(0 0 20px rgba(250,204,21,0.4))",
                }}
              >
                {code?.toUpperCase()}
              </div>

              {/* Copy button */}
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
                onClick={() => navigator.clipboard.writeText(inviteLink)}
              >
                <span>📋</span> Einladungslink kopieren
              </button>
            </div>
          </div>

          {/* ── Players in lobby ── */}
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

            {/* Avatar grid — slot 0 always reserved for host */}
            <div className="flex flex-wrap gap-3">
              {/* Host slot (always first, always shown) */}
              <div className="flex flex-col items-center gap-1 animate-fade-in">
                <div className="relative">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradients[0]} flex items-center justify-center font-black text-lg text-white`}
                    style={{ border: "2px solid rgba(255,255,255,0.12)" }}
                  >
                    {(hostName || "H")[0]?.toUpperCase()}
                  </div>
                  <span className="absolute -top-2 -right-1 text-base">👑</span>
                  <span
                    className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2"
                    style={{ background: "#22c55e", borderColor: "#0a0c1e" }}
                  />
                </div>
                <span className="text-white text-xs font-semibold max-w-[56px] truncate text-center">
                  {hostName || "Host"}
                </span>
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(139,92,246,0.25)",
                    border: "1px solid rgba(139,92,246,0.4)",
                    color: "#a78bfa",
                  }}
                >
                  👑 Host
                </span>
              </div>

              {/* Participant slots */}
              {olympic.participants.map((p, i) => (
                <div
                  key={p.name}
                  className="flex flex-col items-center gap-1 animate-fade-in group relative"
                >
                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradients[(i + 1) % avatarGradients.length]} flex items-center justify-center font-black text-lg text-white`}
                      style={{ border: "2px solid rgba(255,255,255,0.12)" }}
                    >
                      {p.name[0]?.toUpperCase()}
                    </div>
                    {/* Online dot */}
                    <span
                      className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2"
                      style={{ background: "#22c55e", borderColor: "#0a0c1e" }}
                    />
                    {/* Kick button (hover) */}
                    <button
                      className="absolute -top-2 -left-1 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-black items-center justify-center hidden group-hover:flex shadow-lg z-10"
                      onClick={() => kickPlayer(p.name)}
                      title={`Kick ${p.name}`}
                    >
                      ×
                    </button>
                  </div>
                  <span className="text-white text-xs font-semibold max-w-[56px] truncate text-center">
                    {p.name}
                  </span>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({
                length: Math.min(maxPlayers - playerCount - 1, 15),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white/20 text-lg font-light"
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
              <h3 className="font-black text-cyan-400 text-sm mb-1">
                Hinweis für Spieler
              </h3>
              <p className="text-white/50 text-xs leading-relaxed">
                Warte, bis der Host das Spiel startet.
                <br />
                Nur der Host kann Spiele und Regeln ändern.
              </p>
            </div>
          </div>

          {socketError && (
            <div className="text-pink-400 text-sm bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-3">
              ⚠ {socketError}
            </div>
          )}

          {/* ── Start button ── */}
          <button
            className="w-full py-4 rounded-2xl font-black text-base uppercase tracking-widest transition-all duration-200"
            style={
              canStart && !starting
                ? {
                    background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                    color: "#fff",
                    boxShadow: "0 0 40px rgba(236,72,153,0.4)",
                  }
                : {
                    background:
                      "linear-gradient(90deg, rgba(124,58,237,0.35), rgba(236,72,153,0.25))",
                    color: "rgba(255,255,255,0.35)",
                    cursor: "not-allowed",
                  }
            }
            onClick={startOlympic}
            disabled={!canStart || starting}
          >
            {starting ? (
              "Startet…"
            ) : !canStart ? (
              <span className="flex items-center justify-center gap-2">
                <span>👥</span> Mindestens 2 Spieler benötigt, um zu starten
              </span>
            ) : (
              `🚀 Olympiade starten mit ${playerCount} Spieler${playerCount !== 1 ? "n" : ""}`
            )}
          </button>

          {/* Back to draft */}
          <button
            className="w-full py-2 text-sm font-semibold transition-colors"
            style={{ color: "#facc15" }}
            onClick={revertToDraft}
            disabled={reverting}
          >
            {reverting ? "Wird zurückgesetzt…" : "← Zurück zum Entwurf"}
          </button>
        </div>
      </div>
    );
  }

  // ── Active game view ────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header */}
          <GlassCard className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🏅</span>
                <h1 className="font-black text-white text-lg truncate">
                  {olympic.name}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-yellow-400 tracking-widest">
                  🔑 {code?.toUpperCase()}
                </span>
                <button
                  className="text-xs text-muted hover:text-cyan transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/join/${code?.toUpperCase()}`,
                    );
                  }}
                >
                  📋 Copy invite link
                </button>
              </div>
            </div>
            <button
              className="btn-secondary text-sm !px-3 !py-1.5"
              onClick={finishOlympic}
              disabled={finishing}
            >
              {finishing ? "..." : "🏆 End Event"}
            </button>
          </GlassCard>

          {/* Progress bar */}
          <div className="glass rounded-xl px-4 py-3">
            <div className="flex justify-between text-xs text-muted mb-1.5">
              <span>Progress</span>
              <span>
                {scoredCount} / {totalGames} games scored
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

          {socketError && (
            <div className="text-pink-400 text-sm bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-2">
              ⚠ {socketError}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 glass rounded-xl p-1">
            {[
              { key: "game", label: "▶ Game" },
              ...(scoringEnabled ? [{ key: "score", label: "✏️ Score" }] : []),
              ...(scoringEnabled ? [{ key: "board", label: "📊 Board" }] : []),
              { key: "players", label: "👥 Players" },
              { key: "manage", label: "🗒️ Manage" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  if (key === "score") setScoreGame(currentGame);
                  if (key === "manage") setManagingGames([...olympic.games]);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === key
                    ? "bg-purple-500/30 text-white"
                    : "text-muted hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Current Game */}
          {tab === "game" && currentGame && (
            <div className="space-y-4">
              <GameCard
                game={currentGame}
                isCurrent
                isScored={
                  !!olympic.results.find(
                    (r) => String(r.gameId) === String(currentGame._id),
                  )
                }
              />

              {/* Full rules */}
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

              {/* Drinking rules */}
              {currentGame.addons?.drinkingGame?.enabled &&
                currentGame.addons.drinkingGame.rules && (
                  <GlassCard className="border-orange-500/30">
                    <h3 className="text-sm font-semibold text-orange-400 mb-1">
                      🍺 Drinking Rules
                    </h3>
                    <p className="text-sm text-white whitespace-pre-line">
                      {currentGame.addons.drinkingGame.rules}
                    </p>
                  </GlassCard>
                )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3">
                <button
                  className="btn-secondary flex-1"
                  onClick={() => navigate_game("prev")}
                  disabled={olympic.currentGameIndex === 0}
                >
                  ← Prev
                </button>
                <span className="text-muted text-sm whitespace-nowrap">
                  {olympic.currentGameIndex + 1} / {totalGames}
                </span>
                <button
                  className="btn-primary flex-1"
                  onClick={() => navigate_game("next")}
                  disabled={olympic.currentGameIndex >= totalGames - 1}
                >
                  Next →
                </button>
              </div>

              {scoringEnabled && (
                <button
                  className="btn-secondary w-full"
                  onClick={() => {
                    setScoreGame(currentGame);
                    setTab("score");
                  }}
                >
                  ✏️ Enter Score for This Game
                </button>
              )}
            </div>
          )}

          {/* Tab: Score Entry */}
          {tab === "score" && scoringEnabled && (
            <GlassCard>
              {/* Game selector */}
              <div className="mb-4">
                <Select
                  label="Select game to score"
                  value={scoreGame?._id ? String(scoreGame._id) : ""}
                  onChange={(val) => {
                    const g = olympic.games.find(
                      (gm) => String(gm._id) === val,
                    );
                    setScoreGame(g || null);
                  }}
                  placeholder="— pick a game —"
                  options={[
                    { value: "", label: "— pick a game —" },
                    ...olympic.games.map((g) => ({
                      value: String(g._id),
                      label: `${g.icon} ${g.title}${
                        olympic.results.find(
                          (r) => String(r.gameId) === String(g._id),
                        )
                          ? " ✅"
                          : ""
                      }`,
                    })),
                  ]}
                />
              </div>

              {scoreGame ? (
                <ScoreEntry
                  game={scoreGame}
                  participants={olympic.participants}
                  existingResult={olympic.results.find(
                    (r) => String(r.gameId) === String(scoreGame._id),
                  )}
                  onSubmit={submitScore}
                  onCancel={() => setScoreGame(null)}
                />
              ) : (
                <p className="text-muted text-sm text-center py-4">
                  Select a game above.
                </p>
              )}
            </GlassCard>
          )}

          {/* Tab: Scoreboard */}
          {tab === "board" && scoringEnabled && (
            <GlassCard>
              <h2 className="font-bold text-white mb-4">Live Leaderboard</h2>
              <Scoreboard
                leaderboard={leaderboard}
                participants={olympic.participants}
              />
            </GlassCard>
          )}

          {/* Tab: Players */}
          {tab === "players" && (
            <GlassCard>
              <h2 className="font-bold text-white mb-4">
                Participants ({olympic.participants.length})
              </h2>
              <div className="space-y-2">
                {olympic.participants.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-3 py-2 border-b border-white/5"
                  >
                    {p.avatarBase64 ? (
                      <img
                        src={p.avatarBase64}
                        alt={p.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center font-bold">
                        {p.name[0]}
                      </div>
                    )}
                    <span className="font-medium text-white">{p.name}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Tab: Manage Games */}
          {tab === "manage" && (
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white">Spiele verwalten</h2>
                <span className="text-xs text-muted">{managingGames?.length ?? olympic.games.length} Spiele</span>
              </div>
              <p className="text-xs text-white/40 mb-3">
                Reihenfolge ändern oder Spiele entfernen. Spiele mit bereits eingegebenem Ergebnis können trotzdem entfernt werden.
              </p>
              <div className="space-y-2 mb-4">
                {(managingGames ?? olympic.games).map((g, i) => {
                  const scored = !!olympic.results.find(
                    (r) => String(r.gameId) === String(g._id),
                  );
                  return (
                    <div
                      key={String(g._id)}
                      className="flex items-center gap-2 p-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <span className="text-xl w-8 text-center shrink-0">{g.icon}</span>
                      <span className="flex-1 text-sm text-white truncate">{g.title}</span>
                      {scored && <span className="text-green-400 text-xs shrink-0">✅</span>}
                      {/* Move up */}
                      <button
                        className="text-white/30 hover:text-white/80 transition-colors px-1 disabled:opacity-20"
                        disabled={i === 0}
                        onClick={() => {
                          const arr = [...(managingGames ?? olympic.games)];
                          [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                          setManagingGames(arr);
                        }}
                      >▲</button>
                      {/* Move down */}
                      <button
                        className="text-white/30 hover:text-white/80 transition-colors px-1 disabled:opacity-20"
                        disabled={i === (managingGames ?? olympic.games).length - 1}
                        onClick={() => {
                          const arr = [...(managingGames ?? olympic.games)];
                          [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                          setManagingGames(arr);
                        }}
                      >▼</button>
                      {/* Remove */}
                      <button
                        className="text-pink-400/60 hover:text-pink-400 transition-colors px-1 disabled:opacity-20"
                        disabled={(managingGames ?? olympic.games).length <= 1}
                        onClick={() => {
                          const arr = (managingGames ?? olympic.games).filter((_, idx) => idx !== i);
                          setManagingGames(arr);
                        }}
                        title="Spiel entfernen"
                      >✕</button>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-secondary flex-1 text-sm"
                  onClick={() => setManagingGames([...olympic.games])}
                >
                  ↩ Zurücksetzen
                </button>
                <button
                  className="btn-primary flex-1 text-sm"
                  onClick={() => {
                    if (!managingGames) return;
                    getSocket().emit("edit-games", {
                      code: code.toUpperCase(),
                      hostToken,
                      games: managingGames,
                    });
                    setTab("game");
                  }}
                >
                  💾 Änderungen speichern
                </button>
              </div>
            </GlassCard>
          )}

          {/* All games list (mini) */}
          {tab === "game" && (
            <GlassCard>
              <h3 className="text-sm font-semibold text-muted mb-3">
                All Games
              </h3>
              <div className="space-y-1">
                {olympic.games.map((g, i) => {
                  const scored = !!olympic.results.find(
                    (r) => String(r.gameId) === String(g._id),
                  );
                  const isCur = i === olympic.currentGameIndex;
                  return (
                    <button
                      key={g._id}
                      className={`w-full flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg transition-colors text-left ${
                        isCur
                          ? "bg-purple-500/20 text-white"
                          : "text-muted hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => {
                        if (scoringEnabled) {
                          setScoreGame(g);
                          setTab("score");
                        }
                      }}
                    >
                      <span className="w-5 text-center">{i + 1}.</span>
                      <span>{g.icon}</span>
                      <span className="flex-1 truncate">{g.title}</span>
                      {scored && (
                        <span className="text-green-400 text-xs">✅</span>
                      )}
                      {isCur && (
                        <span className="text-yellow-400 text-xs">▶</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </>
  );
}
