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
  const [managingGames, setManagingGames] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [managingSettings, setManagingSettings] = useState(null); // local copy of settings while modal is open
  const [addGameForm, setAddGameForm] = useState({
    title: "",
    icon: "🎮",
    mode: "ffa",
  });

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

  // Sync score panel with current game when navigating
  useEffect(() => {
    if (!olympic || olympic.status !== "active") return;
    const game = olympic.games?.[olympic.currentGameIndex];
    if (game) setScoreGame(game);
  }, [olympic?.currentGameIndex, olympic?.status]); // eslint-disable-line

  function kickPlayer(playerName) {
    getSocket().emit("kick-player", {
      code: code.toUpperCase(),
      hostToken,
      playerName,
    });
  }

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
      <>
        <div className="min-h-screen px-4 py-10">
          <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
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
                  Teile den Code mit deinen Freunden, damit sie beitreten
                  können.
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
              className="rounded-2xl p-6"
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
              <div className="flex flex-wrap gap-4">
                {/* Host slot (always first, always shown) */}
                <div className="flex flex-col items-center gap-1.5 animate-fade-in">
                  <div className="relative">
                    <div
                      className={`w-[70px] h-[70px] rounded-2xl bg-gradient-to-br ${avatarGradients[0]} flex items-center justify-center font-black text-xl text-white`}
                      style={{ border: "2px solid rgba(255,255,255,0.12)" }}
                    >
                      {(hostName || "H")[0]?.toUpperCase()}
                    </div>
                    <span className="absolute -top-2 -right-1 text-base">
                      👑
                    </span>
                    <span
                      className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2"
                      style={{ background: "#22c55e", borderColor: "#0a0c1e" }}
                    />
                  </div>
                  <span className="text-white text-xs font-semibold max-w-[72px] truncate text-center">
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
                    className="flex flex-col items-center gap-1.5 animate-fade-in group relative"
                  >
                    <div className="relative">
                      <div
                        className={`w-[70px] h-[70px] rounded-2xl bg-gradient-to-br ${avatarGradients[(i + 1) % avatarGradients.length]} flex items-center justify-center font-black text-xl text-white`}
                        style={{ border: "2px solid rgba(255,255,255,0.12)" }}
                      >
                        {p.name[0]?.toUpperCase()}
                      </div>
                      {/* Online dot */}
                      <span
                        className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2"
                        style={{
                          background: "#22c55e",
                          borderColor: "#0a0c1e",
                        }}
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
                    <span className="text-white text-xs font-semibold max-w-[72px] truncate text-center">
                      {p.name}
                    </span>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({
                  length: Math.min(maxPlayers - playerCount - 1, 12),
                }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="w-[70px] h-[70px] rounded-2xl flex items-center justify-center text-white/20 text-2xl font-light"
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

  // ── Active game view ────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* ── Header bar ── */}
          <div
            className="flex items-center justify-between gap-4 rounded-2xl px-6 py-4"
            style={{
              background: "rgba(10,12,30,0.95)",
              border: "1px solid rgba(139,92,246,0.38)",
              boxShadow: "0 0 30px rgba(139,92,246,0.1)",
            }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xl">🏅</span>
                <h1 className="font-black text-white text-xl truncate">
                  {olympic.name}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-yellow-400 tracking-widest">
                  {code?.toUpperCase()}
                </span>
                <button
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${window.location.origin}/join/${code?.toUpperCase()}`,
                    )
                  }
                >
                  📋 Link kopieren
                </button>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="hidden md:flex flex-col items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-white/30">
                {scoredCount} / {totalGames} bewertet
              </span>
              <div className="w-36 h-1.5 bg-white/8 rounded-full overflow-hidden">
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

            <div className="flex gap-2.5 flex-shrink-0">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: "rgba(139,92,246,0.12)",
                  border: "1px solid rgba(139,92,246,0.42)",
                  color: "#a78bfa",
                  boxShadow: "0 0 12px rgba(139,92,246,0.12)",
                }}
                onClick={() => {
                  setManagingGames([...olympic.games]);
                  setManagingSettings({
                    name: olympic.name,
                    maxPlayers: olympic.maxPlayers,
                    scoringMode: olympic.scoringMode || "linear",
                    tieRule: olympic.tieRule || "tiebreaker",
                    extraRules: { ...olympic.extraRules },
                    hostParticipates: !!olympic.hostParticipates,
                    hostPlayerName: olympic.hostPlayerName || "",
                    hideGamePlan: !!olympic.hideGamePlan,
                  });
                  setAddGameForm({ title: "", icon: "🎮", mode: "ffa" });
                  setShowManageModal(true);
                }}
              >
                ⚙️ Verwalten
              </button>
              <button
                className="btn-primary text-sm !py-2 !px-4"
                onClick={finishOlympic}
                disabled={finishing}
              >
                {finishing ? "…" : "🏆 Beenden"}
              </button>
            </div>
          </div>

          {socketError && (
            <div className="text-pink-400 text-sm bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-3">
              ⚠ {socketError}
            </div>
          )}

          {/* ── Two-column main layout ── */}
          <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
            {/* ── Left column: current game + games list ── */}
            <div className="space-y-4">
              {currentGame ? (
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: "rgba(10,12,30,0.97)",
                    border: "1px solid rgba(139,92,246,0.4)",
                    boxShadow: "0 0 50px rgba(139,92,246,0.12)",
                  }}
                >
                  {/* Game header */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.12))",
                          border: "1px solid rgba(139,92,246,0.32)",
                        }}
                      >
                        {currentGame.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">
                          Spiel {olympic.currentGameIndex + 1} von {totalGames}
                        </p>
                        <h2 className="text-2xl font-black text-white leading-tight">
                          {currentGame.title}
                        </h2>
                        <span
                          className="inline-block text-xs font-black uppercase px-2.5 py-0.5 rounded-full mt-1.5"
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
                      </div>
                    </div>
                    {olympic.results.find(
                      (r) => String(r.gameId) === String(currentGame._id),
                    ) && (
                      <span className="text-green-400 text-2xl flex-shrink-0">
                        ✅
                      </span>
                    )}
                  </div>

                  {currentGame.rules && (
                    <div
                      className="rounded-xl p-4 mb-4"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 mb-1.5">
                        Regeln
                      </p>
                      <p className="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                        {currentGame.rules}
                      </p>
                    </div>
                  )}

                  {currentGame.addons?.drinkingGame?.enabled &&
                    currentGame.addons.drinkingGame.rules && (
                      <div
                        className="rounded-xl p-4 mb-4"
                        style={{
                          background: "rgba(251,146,60,0.06)",
                          border: "1px solid rgba(251,146,60,0.25)",
                        }}
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400/70 mb-1.5">
                          🍺 Trinkregeln
                        </p>
                        <p className="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                          {currentGame.addons.drinkingGame.rules}
                        </p>
                      </div>
                    )}

                  {/* Navigation */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      className="btn-secondary flex-1"
                      onClick={() => navigate_game("prev")}
                      disabled={olympic.currentGameIndex === 0}
                    >
                      ← Zurück
                    </button>
                    <span className="text-white/25 text-sm font-mono whitespace-nowrap">
                      {olympic.currentGameIndex + 1} / {totalGames}
                    </span>
                    <button
                      className="btn-primary flex-1"
                      onClick={() => navigate_game("next")}
                      disabled={olympic.currentGameIndex >= totalGames - 1}
                    >
                      Weiter →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass rounded-2xl p-8 text-center text-muted">
                  Kein Spiel ausgewählt
                </div>
              )}

              {/* Games timeline */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(10,12,30,0.9)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4">
                  Spielplan
                </h3>
                <div className="space-y-1.5">
                  {olympic.games.map((g, i) => {
                    const scored = !!olympic.results.find(
                      (r) => String(r.gameId) === String(g._id),
                    );
                    const isCur = i === olympic.currentGameIndex;
                    return (
                      <button
                        key={String(g._id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
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
                        onClick={() => {
                          if (scoringEnabled) setScoreGame(g);
                        }}
                      >
                        <span
                          className="text-xs font-black w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isCur
                              ? "rgba(139,92,246,0.4)"
                              : "rgba(255,255,255,0.05)",
                            color: isCur ? "#c4b5fd" : "#555",
                          }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-base flex-shrink-0">
                          {g.icon}
                        </span>
                        <span
                          className={`flex-1 text-sm font-semibold truncate ${isCur ? "text-white" : "text-white/40"}`}
                        >
                          {g.title}
                        </span>
                        {scored && (
                          <span className="text-green-400 text-xs flex-shrink-0">
                            ✅
                          </span>
                        )}
                        {isCur && (
                          <span className="text-yellow-400 text-[10px] font-black uppercase flex-shrink-0">
                            ▶ Aktiv
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Right column: score entry + leaderboard ── */}
            <div className="space-y-4 lg:sticky lg:top-6">
              {scoringEnabled ? (
                <>
                  {/* Score entry */}
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      background: "rgba(10,12,30,0.97)",
                      border: "1px solid rgba(236,72,153,0.35)",
                      boxShadow: "0 0 30px rgba(236,72,153,0.08)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p
                        className="text-[10px] font-black uppercase tracking-[0.2em]"
                        style={{ color: "#ec4899" }}
                      >
                        ✏️ Ergebnis eintragen
                      </p>
                      {scoreGame && scoreGame._id !== currentGame?._id && (
                        <button
                          className="text-xs text-white/30 hover:text-white/60 transition-colors"
                          onClick={() => setScoreGame(currentGame)}
                        >
                          → Aktuelles Spiel
                        </button>
                      )}
                    </div>

                    <div className="mb-4">
                      <Select
                        value={scoreGame?._id ? String(scoreGame._id) : ""}
                        onChange={(val) => {
                          const g = olympic.games.find(
                            (gm) => String(gm._id) === val,
                          );
                          setScoreGame(g || null);
                        }}
                        options={olympic.games.map((g) => ({
                          value: String(g._id),
                          label: `${g.icon} ${g.title}${olympic.results.find((r) => String(r.gameId) === String(g._id)) ? " ✅" : ""}`,
                        }))}
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
                      />
                    ) : (
                      <p className="text-white/25 text-sm text-center py-4">
                        Spiel auswählen ↑
                      </p>
                    )}
                  </div>

                  {/* Live leaderboard */}
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      background: "rgba(10,12,30,0.9)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-4">
                      📊 Live Tabelle
                    </p>
                    <Scoreboard
                      leaderboard={leaderboard}
                      participants={olympic.participants}
                    />
                  </div>
                </>
              ) : (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{
                    background: "rgba(10,12,30,0.9)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p className="text-white/30 text-sm">Wertung deaktiviert</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Manage Modal ── */}
      {showManageModal && managingSettings && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{
            backdropFilter: "blur(6px)",
            background: "rgba(0,0,0,0.65)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowManageModal(false);
          }}
        >
          <div
            className="relative w-full max-w-lg animate-slide-up"
            style={{
              background:
                "linear-gradient(145deg, rgba(12,15,35,0.99), rgba(18,22,50,0.99))",
              border: "1px solid rgba(139,92,246,0.45)",
              boxShadow:
                "0 0 80px rgba(139,92,246,0.22), 0 40px 80px rgba(0,0,0,0.6)",
              borderRadius: "24px",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            {/* Modal header */}
            <div
              className="sticky top-0 flex items-center justify-between px-6 py-4 z-10"
              style={{
                background: "rgba(12,15,35,0.98)",
                borderBottom: "1px solid rgba(139,92,246,0.2)",
                borderRadius: "24px 24px 0 0",
              }}
            >
              <h2 className="font-black text-white text-lg">
                ⚙️ Olympiade verwalten
              </h2>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                onClick={() => setShowManageModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-7">
              {/* ── Spieler ── */}
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em] mb-3"
                  style={{ color: "#ec4899" }}
                >
                  Spieler ({olympic.participants.length})
                </p>
                <div className="space-y-2">
                  {olympic.participants.length === 0 ? (
                    <p className="text-white/25 text-sm text-center py-3">
                      Keine Spieler
                    </p>
                  ) : (
                    olympic.participants.map((p, i) => {
                      const gradients = [
                        "from-pink-500 to-purple-600",
                        "from-purple-500 to-blue-600",
                        "from-cyan-500 to-blue-500",
                        "from-green-400 to-teal-500",
                        "from-orange-400 to-pink-500",
                        "from-yellow-400 to-orange-500",
                      ];
                      return (
                        <div
                          key={p.name}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center font-black text-sm text-white flex-shrink-0`}
                          >
                            {p.name[0]?.toUpperCase()}
                          </div>
                          <span className="flex-1 font-semibold text-white text-sm truncate">
                            {p.name}
                          </span>
                          <button
                            className="text-xs px-2.5 py-1 rounded-lg font-bold transition-all flex-shrink-0"
                            style={{
                              background: "rgba(236,72,153,0.1)",
                              color: "#f472b6",
                              border: "1px solid rgba(236,72,153,0.22)",
                            }}
                            onClick={() => kickPlayer(p.name)}
                          >
                            Kick ✕
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ── Spiele ── */}
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em] mb-3"
                  style={{ color: "#a78bfa" }}
                >
                  Spiele ({(managingGames ?? olympic.games).length})
                </p>
                <div className="space-y-2 mb-3">
                  {(managingGames ?? olympic.games).map((g, i) => {
                    const scored = !!olympic.results.find(
                      (r) => String(r.gameId) === String(g._id),
                    );
                    const isCur = i === olympic.currentGameIndex;
                    return (
                      <div
                        key={g._id ? String(g._id) : `new-${i}`}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                        style={{
                          background: isCur
                            ? "rgba(139,92,246,0.1)"
                            : "rgba(255,255,255,0.04)",
                          border: `1px solid ${isCur ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.07)"}`,
                        }}
                      >
                        <span className="text-xl w-8 text-center flex-shrink-0">
                          {g.icon}
                        </span>
                        <span
                          className={`flex-1 text-sm truncate ${isCur ? "text-white font-bold" : "text-white/70"}`}
                        >
                          {g.title}
                        </span>
                        {isCur && (
                          <span className="text-yellow-400 text-[10px] font-black flex-shrink-0">
                            ▶
                          </span>
                        )}
                        {scored && (
                          <span className="text-green-400 text-xs flex-shrink-0">
                            ✅
                          </span>
                        )}
                        <button
                          className="text-white/25 hover:text-white/80 transition-colors w-5 text-xs disabled:opacity-20 flex-shrink-0"
                          disabled={i === 0}
                          onClick={() => {
                            const arr = [...(managingGames ?? olympic.games)];
                            [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                            setManagingGames(arr);
                          }}
                        >
                          ▲
                        </button>
                        <button
                          className="text-white/25 hover:text-white/80 transition-colors w-5 text-xs disabled:opacity-20 flex-shrink-0"
                          disabled={
                            i === (managingGames ?? olympic.games).length - 1
                          }
                          onClick={() => {
                            const arr = [...(managingGames ?? olympic.games)];
                            [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                            setManagingGames(arr);
                          }}
                        >
                          ▼
                        </button>
                        <button
                          className="text-pink-400/50 hover:text-pink-400 transition-colors w-5 text-sm disabled:opacity-20 flex-shrink-0"
                          disabled={
                            (managingGames ?? olympic.games).length <= 1
                          }
                          onClick={() =>
                            setManagingGames(
                              (managingGames ?? olympic.games).filter(
                                (_, idx) => idx !== i,
                              ),
                            )
                          }
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add game inline form */}
                <div
                  className="rounded-xl p-3 mb-3 space-y-2"
                  style={{
                    background: "rgba(139,92,246,0.06)",
                    border: "1px solid rgba(139,92,246,0.18)",
                  }}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-400/70">
                    + Spiel hinzufügen
                  </p>
                  <div className="flex gap-2">
                    <input
                      className="w-12 text-center rounded-lg px-2 py-1.5 text-base bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                      placeholder="🎮"
                      maxLength={2}
                      value={addGameForm.icon}
                      onChange={(e) =>
                        setAddGameForm((f) => ({
                          ...f,
                          icon: e.target.value || "🎮",
                        }))
                      }
                    />
                    <input
                      className="flex-1 rounded-lg px-3 py-1.5 text-sm bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-purple-500/50"
                      placeholder="Spielname…"
                      maxLength={60}
                      value={addGameForm.title}
                      onChange={(e) =>
                        setAddGameForm((f) => ({ ...f, title: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && addGameForm.title.trim()) {
                          setManagingGames([
                            ...(managingGames ?? olympic.games),
                            {
                              ...addGameForm,
                              title: addGameForm.title.trim(),
                              order: (managingGames ?? olympic.games).length,
                            },
                          ]);
                          setAddGameForm({
                            title: "",
                            icon: "🎮",
                            mode: "ffa",
                          });
                        }
                      }}
                    />
                    <select
                      className="rounded-lg px-2 py-1.5 text-xs bg-white/5 border border-white/10 text-white/70 focus:outline-none focus:border-purple-500/50"
                      value={addGameForm.mode}
                      onChange={(e) =>
                        setAddGameForm((f) => ({ ...f, mode: e.target.value }))
                      }
                    >
                      <option value="ffa">FFA</option>
                      <option value="team">Team</option>
                    </select>
                    <button
                      className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all disabled:opacity-30"
                      style={{
                        background: "rgba(139,92,246,0.25)",
                        border: "1px solid rgba(139,92,246,0.45)",
                        color: "#c4b5fd",
                      }}
                      disabled={!addGameForm.title.trim()}
                      onClick={() => {
                        setManagingGames([
                          ...(managingGames ?? olympic.games),
                          {
                            ...addGameForm,
                            title: addGameForm.title.trim(),
                            order: (managingGames ?? olympic.games).length,
                          },
                        ]);
                        setAddGameForm({ title: "", icon: "🎮", mode: "ffa" });
                      }}
                    >
                      ＋
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="btn-secondary flex-1 text-sm !py-2"
                    onClick={() => setManagingGames([...olympic.games])}
                  >
                    ↩ Reset
                  </button>
                  <button
                    className="btn-primary flex-1 text-sm !py-2"
                    onClick={() => {
                      if (!managingGames) return;
                      getSocket().emit("edit-games", {
                        code: code.toUpperCase(),
                        hostToken,
                        games: managingGames,
                      });
                      setManagingGames(null);
                    }}
                  >
                    💾 Spiele speichern
                  </button>
                </div>
              </div>

              {/* ── Einstellungen ── */}
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em] mb-4"
                  style={{ color: "#22d3ee" }}
                >
                  Einstellungen
                </p>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-1.5">
                      Event Name
                    </label>
                    <input
                      className="w-full rounded-xl px-4 py-2.5 text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      maxLength={60}
                      value={managingSettings.name}
                      onChange={(e) =>
                        setManagingSettings((s) => ({
                          ...s,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Max Players */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-1.5">
                      Max. Spieler
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={50}
                      className="w-full rounded-xl px-4 py-2.5 text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                      value={managingSettings.maxPlayers}
                      onChange={(e) =>
                        setManagingSettings((s) => ({
                          ...s,
                          maxPlayers: Math.max(
                            2,
                            Math.min(50, Number(e.target.value)),
                          ),
                        }))
                      }
                    />
                  </div>

                  {/* Scoring Mode */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-1.5">
                      Wertungssystem
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "linear", label: "Linear" },
                        { value: "top3", label: "Top 3" },
                        { value: "f1", label: "F1" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          className="py-2 rounded-xl text-xs font-bold transition-all"
                          style={
                            managingSettings.scoringMode === opt.value
                              ? {
                                  background: "rgba(34,211,238,0.15)",
                                  border: "1px solid rgba(34,211,238,0.4)",
                                  color: "#22d3ee",
                                }
                              : {
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  color: "rgba(255,255,255,0.4)",
                                }
                          }
                          onClick={() =>
                            setManagingSettings((s) => ({
                              ...s,
                              scoringMode: opt.value,
                            }))
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tie Rule */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-1.5">
                      Tie-Breaker Regel
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "tiebreaker", label: "Tiebreaker Frage" },
                        { value: "shared_points", label: "Punkte teilen" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          className="py-2 rounded-xl text-xs font-bold transition-all"
                          style={
                            managingSettings.tieRule === opt.value
                              ? {
                                  background: "rgba(34,211,238,0.15)",
                                  border: "1px solid rgba(34,211,238,0.4)",
                                  color: "#22d3ee",
                                }
                              : {
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  color: "rgba(255,255,255,0.4)",
                                }
                          }
                          onClick={() =>
                            setManagingSettings((s) => ({
                              ...s,
                              tieRule: opt.value,
                            }))
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bonus / Malus Rules */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-2">
                      Bonus / Malus Regeln
                    </label>
                    <div className="space-y-1.5">
                      {[
                        {
                          key: "comebackPenalty",
                          emoji: "↩️",
                          label: "Comeback Malus",
                          badge: "−2 PT",
                          cls: "text-pink-400",
                        },
                        {
                          key: "lastPlaceBonus",
                          emoji: "🎯",
                          label: "Last Place Bonus",
                          badge: "+1 PT",
                          cls: "text-green-400",
                        },
                        {
                          key: "winStreakBonus",
                          emoji: "🔥",
                          label: "Win Streak Bonus",
                          badge: "+1 PT",
                          cls: "text-green-400",
                        },
                        {
                          key: "finalDoublePoints",
                          emoji: "⭐",
                          label: "Final Double Points",
                          badge: "2×",
                          cls: "text-yellow-400",
                        },
                      ].map(({ key, emoji, label, badge, cls }) => (
                        <button
                          key={key}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all"
                          style={
                            managingSettings.extraRules?.[key]
                              ? {
                                  background: "rgba(139,92,246,0.1)",
                                  border: "1px solid rgba(139,92,246,0.3)",
                                }
                              : {
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.07)",
                                }
                          }
                          onClick={() =>
                            setManagingSettings((s) => ({
                              ...s,
                              extraRules: {
                                ...s.extraRules,
                                [key]: !s.extraRules?.[key],
                              },
                            }))
                          }
                        >
                          <span className="text-base w-5 flex-shrink-0">
                            {emoji}
                          </span>
                          <span className="flex-1 text-xs font-semibold text-white/70">
                            {label}
                          </span>
                          <span
                            className={`text-xs font-black flex-shrink-0 ${cls}`}
                          >
                            {badge}
                          </span>
                          <span
                            className="w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all"
                            style={
                              managingSettings.extraRules?.[key]
                                ? {
                                    background: "rgba(139,92,246,0.5)",
                                    borderColor: "rgba(139,92,246,0.8)",
                                  }
                                : {
                                    background: "transparent",
                                    borderColor: "rgba(255,255,255,0.2)",
                                  }
                            }
                          >
                            {managingSettings.extraRules?.[key] && (
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M2 6l3 3 5-5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Host participates */}
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <p className="text-xs font-semibold text-white/70">
                        🎮 Host spielt mit
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        Score des Hosts wird mitgezählt
                      </p>
                    </div>
                    <button
                      className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                      style={{
                        background: managingSettings.hostParticipates
                          ? "rgba(34,211,238,0.5)"
                          : "rgba(255,255,255,0.1)",
                        border: `1px solid ${managingSettings.hostParticipates ? "rgba(34,211,238,0.7)" : "rgba(255,255,255,0.15)"}`,
                      }}
                      onClick={() =>
                        setManagingSettings((s) => ({
                          ...s,
                          hostParticipates: !s.hostParticipates,
                        }))
                      }
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{
                          background: managingSettings.hostParticipates
                            ? "#22d3ee"
                            : "rgba(255,255,255,0.4)",
                          left: managingSettings.hostParticipates
                            ? "calc(100% - 22px)"
                            : "2px",
                        }}
                      />
                    </button>
                  </div>

                  {managingSettings.hostParticipates && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-1.5">
                        Host Spielername
                      </label>
                      <input
                        className="w-full rounded-xl px-4 py-2.5 text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        maxLength={30}
                        placeholder="z.B. Alex"
                        value={managingSettings.hostPlayerName}
                        onChange={(e) =>
                          setManagingSettings((s) => ({
                            ...s,
                            hostPlayerName: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  {/* Hide game plan */}
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <p className="text-xs font-semibold text-white/70">
                        🔒 Spielplan verstecken
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        Spieltitel werden bei Teilnehmern unscharf
                      </p>
                    </div>
                    <button
                      className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                      style={{
                        background: managingSettings.hideGamePlan
                          ? "rgba(250,204,21,0.5)"
                          : "rgba(255,255,255,0.1)",
                        border: `1px solid ${managingSettings.hideGamePlan ? "rgba(250,204,21,0.7)" : "rgba(255,255,255,0.15)"}`,
                      }}
                      onClick={() =>
                        setManagingSettings((s) => ({
                          ...s,
                          hideGamePlan: !s.hideGamePlan,
                        }))
                      }
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{
                          background: managingSettings.hideGamePlan
                            ? "#facc15"
                            : "rgba(255,255,255,0.4)",
                          left: managingSettings.hideGamePlan
                            ? "calc(100% - 22px)"
                            : "2px",
                        }}
                      />
                    </button>
                  </div>
                </div>

                <button
                  className="btn-primary w-full text-sm !py-2.5 mt-4"
                  onClick={() => {
                    getSocket().emit("update-settings", {
                      code: code.toUpperCase(),
                      hostToken,
                      settings: managingSettings,
                    });
                  }}
                >
                  💾 Einstellungen speichern
                </button>
              </div>

              {/* ── Danger zone ── */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(250,204,21,0.04)",
                  border: "1px solid rgba(250,204,21,0.15)",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400/60 mb-3">
                  Gefahrenzone
                </p>
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: "rgba(250,204,21,0.07)",
                    color: "#facc15",
                    border: "1px solid rgba(250,204,21,0.18)",
                  }}
                  onClick={() => {
                    setShowManageModal(false);
                    revertToDraft();
                  }}
                >
                  ↩ Olympiade zurück zum Entwurf
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
