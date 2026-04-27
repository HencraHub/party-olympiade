import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connectSocket, getSocket } from '../socket/socket.js';
import useOlympicStore from '../store/useOlympicStore.js';
import GlassCard from '../components/ui/GlassCard.jsx';
import GameCard from '../components/GameCard.jsx';
import Scoreboard from '../components/Scoreboard.jsx';

export default function ParticipantView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { olympic, leaderboard, participantName, updateFromRoomEvent, setConnected } = useOlympicStore();
  const [joined, setJoined] = useState(!!olympic);
  const [tab, setTab] = useState('game');
  const [socketError, setSocketError] = useState('');

  useEffect(() => {
    if (!code) return;

    // If we already have an olympic in store (came from JoinPage), just listen for updates
    const socket = connectSocket();

    socket.on('room-update', (data) => {
      updateFromRoomEvent(data);
      setConnected(true);
      setJoined(true);
    });

    socket.on('olympic-finished', () => {
      navigate(`/room/${code}/winner`);
    });

    socket.on('error', ({ message }) => setSocketError(message));

    // If we don't have an olympic yet (direct URL access), try to join as spectator
    if (!olympic) {
      socket.emit('join-room', { code: code.toUpperCase(), name: participantName || 'Guest', isHost: false });
    }

    return () => {
      socket.off('room-update');
      socket.off('olympic-finished');
      socket.off('error');
    };
  }, [code]);

  if (!olympic || !joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-muted animate-pulse text-center">
          {socketError || `Connecting to room ${code}…`}
        </div>
        {socketError && (
          <button className="btn-secondary" onClick={() => navigate(`/join/${code}`)}>
            Try joining again
          </button>
        )}
      </div>
    );
  }

  // ── Lobby waiting room ──────────────────────────────────────────────────
  if (olympic.status === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 gap-5">
        <div className="w-full max-w-sm space-y-4 animate-slide-up">
          <GlassCard className="text-center py-8">
            <div className="text-5xl mb-3">⏳</div>
            <h2 className="text-xl font-bold text-white mb-1">{olympic.name}</h2>
            <p className="text-muted text-sm mb-4 animate-pulse">Waiting for the host to start…</p>
            {participantName && (
              <p className="text-sm">
                You joined as{' '}
                <span className="text-purple-light font-semibold">{participantName}</span>
              </p>
            )}
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold text-muted text-sm mb-3">
              Players in lobby ({olympic.participants.length})
            </h3>
            <div className="space-y-2">
              {olympic.participants.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center text-xs font-bold">
                    {p.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-white">{p.name}</span>
                  {p.name === participantName && (
                    <span className="text-xs text-purple-400 ml-1">(you)</span>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const currentGame = olympic.games[olympic.currentGameIndex];
  const totalGames = olympic.games.length;
  const scoredCount = olympic.results.length;
  const progress = totalGames > 0 ? Math.round((scoredCount / totalGames) * 100) : 0;

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <GlassCard className="text-center py-4">
          <div className="text-3xl mb-1">🏅</div>
          <h1 className="font-black text-white text-xl">{olympic.name}</h1>
          {participantName && (
            <p className="text-sm text-muted mt-1">You're in as <span className="text-purple-light font-semibold">{participantName}</span></p>
          )}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-yellow-400 font-mono font-bold tracking-widest">{code?.toUpperCase()}</span>
          </div>
        </GlassCard>

        {/* Progress */}
        <div className="glass rounded-xl px-4 py-3">
          <div className="flex justify-between text-xs text-muted mb-1.5">
            <span>Progress</span>
            <span>{scoredCount}/{totalGames} games</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 glass rounded-xl p-1">
          {[
            { key: 'game', label: '▶ Current Game' },
            { key: 'board', label: '📊 Leaderboard' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key ? 'bg-purple-500/30 text-white' : 'text-muted hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Game */}
        {tab === 'game' && (
          <div className="space-y-4 animate-fade-in">
            {currentGame ? (
              <>
                <GameCard
                  game={currentGame}
                  isCurrent
                  isScored={!!olympic.results.find((r) => String(r.gameId) === String(currentGame._id))}
                />

                {currentGame.rules && (
                  <GlassCard>
                    <h3 className="text-sm font-semibold text-muted mb-2">Rules</h3>
                    <p className="text-sm text-white whitespace-pre-line">{currentGame.rules}</p>
                  </GlassCard>
                )}

                {currentGame.addons?.drinkingGame?.enabled && (
                  <GlassCard className="border-orange-500/30">
                    <h3 className="text-sm font-semibold text-orange-400 mb-1">🍺 Drinking Rules</h3>
                    <p className="text-sm text-white whitespace-pre-line">
                      {currentGame.addons.drinkingGame.rules || 'Enabled — ask the host for rules.'}
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
        {tab === 'board' && (
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
