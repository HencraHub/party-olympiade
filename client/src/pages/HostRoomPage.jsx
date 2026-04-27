import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { connectSocket, getSocket } from "../socket/socket.js";
import useOlympicStore from "../store/useOlympicStore.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import GameCard from "../components/GameCard.jsx";
import Scoreboard from "../components/Scoreboard.jsx";
import ScoreEntry from "../components/ScoreEntry.jsx";

export default function HostRoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { olympic, leaderboard, updateFromRoomEvent, setConnected } =
    useOlympicStore();

  const [tab, setTab] = useState("game"); // 'game' | 'score' | 'board' | 'players'
  const [scoreGame, setScoreGame] = useState(null); // game being scored
  const [socketError, setSocketError] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [reverting, setReverting] = useState(false);

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
    if (
      !confirm("Revert to draft? All players will be removed from the lobby.")
    )
      return;
    setReverting(true);
    const socket = getSocket();
    socket.emit("revert-to-draft", { code: code.toUpperCase(), hostToken });
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
    if (
      !confirm("End the Olympic and reveal the winner? This cannot be undone.")
    )
      return;
    setFinishing(true);
    const socket = getSocket();
    socket.emit("finish-olympic", { code: code.toUpperCase(), hostToken });
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

  const existingResult = scoreGame
    ? olympic.results.find((r) => String(r.gameId) === String(scoreGame._id))
    : null;

  // ── Lobby waiting room ──────────────────────────────────────────────────
  if (olympic.status === "lobby") {
    const inviteLink = `${window.location.origin}/join/${code?.toUpperCase()}`;
    const playerCount = olympic.participants.length;
    const maxPlayers = olympic.maxPlayers || 20;

    return (
      <div className="min-h-screen px-4 py-10">
        <div className="max-w-lg mx-auto space-y-5 animate-slide-up">
          {/* Room code card */}
          <GlassCard glow className="text-center py-8">
            <h1 className="font-black text-white text-2xl mb-1">
              {olympic.name}
            </h1>
            <p className="text-sm text-muted mb-5">
              Share this code — players go to the website and enter it
            </p>
            <div
              className="text-7xl font-black tracking-widest mb-4 select-all"
              style={{
                background: "linear-gradient(90deg, #facc15, #f59e0b)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {code?.toUpperCase()}
            </div>
            <button
              className="btn-ghost text-sm"
              onClick={() => navigator.clipboard.writeText(inviteLink)}
            >
              📋 Copy invite link
            </button>
          </GlassCard>

          {/* Player list */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Players in lobby</h2>
              <span className="text-sm text-muted">
                {playerCount} / {maxPlayers}
              </span>
            </div>

            {/* Progress dots */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Array.from({ length: maxPlayers }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i < playerCount ? "bg-purple-500" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            {playerCount === 0 ? (
              <p className="text-muted text-sm text-center py-4 animate-pulse">
                Waiting for players to join…
              </p>
            ) : (
              <div className="space-y-2">
                {olympic.participants.map((p, i) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-3 py-1 animate-fade-in"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center text-sm font-bold">
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{p.name}</span>
                    <span className="ml-auto text-xs text-muted">#{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {socketError && (
            <div className="text-pink-400 text-sm bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-2">
              ⚠ {socketError}
            </div>
          )}

          {/* Start button */}
          <button
            className="btn-primary w-full py-4 text-lg"
            onClick={startOlympic}
            disabled={playerCount < 2 || starting}
          >
            {starting
              ? "Starting…"
              : playerCount < 2
                ? `Need at least 2 players (${playerCount} joined)`
                : `🚀 Start Olympic with ${playerCount} player${playerCount !== 1 ? "s" : ""}`}
          </button>

          {/* Revert to draft */}
          <button
            className="btn-ghost w-full text-sm text-amber-400 hover:bg-amber-500/10"
            onClick={revertToDraft}
            disabled={reverting}
          >
            {reverting ? "Reverting…" : "↩ Revert to Draft"}
          </button>
        </div>
      </div>
    );
  }

  // ── Active game view ────────────────────────────────────────────────────
  return (
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
            { key: "score", label: "✏️ Score" },
            { key: "board", label: "📊 Board" },
            { key: "players", label: "👥 Players" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                if (key === "score") setScoreGame(currentGame);
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
                <h3 className="text-sm font-semibold text-muted mb-2">Rules</h3>
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

            <button
              className="btn-secondary w-full"
              onClick={() => {
                setScoreGame(currentGame);
                setTab("score");
              }}
            >
              ✏️ Enter Score for This Game
            </button>
          </div>
        )}

        {/* Tab: Score Entry */}
        {tab === "score" && (
          <GlassCard>
            {/* Game selector */}
            <div className="mb-4">
              <label className="label">Select game to score</label>
              <select
                className="input-field"
                value={scoreGame?._id || ""}
                onChange={(e) => {
                  const g = olympic.games.find(
                    (gm) => String(gm._id) === e.target.value,
                  );
                  setScoreGame(g || null);
                }}
              >
                <option value="">— pick a game —</option>
                {olympic.games.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.icon} {g.title}
                    {olympic.results.find(
                      (r) => String(r.gameId) === String(g._id),
                    )
                      ? " ✅"
                      : ""}
                  </option>
                ))}
              </select>
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
        {tab === "board" && (
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

        {/* All games list (mini) */}
        {tab === "game" && (
          <GlassCard>
            <h3 className="text-sm font-semibold text-muted mb-3">All Games</h3>
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
                      setScoreGame(g);
                      setTab("score");
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
  );
}
