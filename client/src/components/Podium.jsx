import { useEffect, useRef } from 'react';

const PODIUM_HEIGHTS = ['h-28', 'h-20', 'h-14'];
const PODIUM_ORDER = [1, 0, 2]; // display order: 2nd, 1st, 3rd
const MEDALS = ['🥇', '🥈', '🥉'];
const DELAY = ['delay-300', 'delay-0', 'delay-600'];

export default function Podium({ leaderboard = [], participants = [] }) {
  const top3 = leaderboard.slice(0, 3);

  // Pad to 3 slots
  while (top3.length < 3) top3.push(null);

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4 px-4">
      {PODIUM_ORDER.map((rankIdx, displayIdx) => {
        const entry = top3[rankIdx];
        if (!entry) return <div key={displayIdx} className="w-24 sm:w-32" />;

        const participant = participants.find((p) => p.name === entry.name);
        const animDelay = DELAY[displayIdx];

        return (
          <div
            key={entry.name}
            className={`flex flex-col items-center animate-podium-rise ${animDelay} opacity-0`}
            style={{ animationFillMode: 'forwards' }}
          >
            {/* Avatar */}
            <div className="mb-2">
              {participant?.avatarBase64 ? (
                <img
                  src={participant.avatarBase64}
                  alt={entry.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-purple-500/60 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center text-3xl font-bold shadow-lg">
                  {entry.name[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Medal */}
            <div className="text-3xl mb-1">{MEDALS[rankIdx]}</div>

            {/* Name */}
            <div className="text-sm sm:text-base font-bold text-white text-center max-w-[90px] sm:max-w-[120px] truncate">
              {entry.name}
            </div>

            {/* Points */}
            <div className="text-xs text-muted mb-2">{entry.total} pts</div>

            {/* Podium block */}
            <div
              className={`w-20 sm:w-28 ${PODIUM_HEIGHTS[rankIdx]} rounded-t-xl flex items-center justify-center text-2xl font-black text-white/20`}
              style={{
                background:
                  rankIdx === 0
                    ? 'linear-gradient(180deg, #8b5cf6, #6d28d9)'
                    : rankIdx === 1
                    ? 'linear-gradient(180deg, rgba(139,92,246,0.6), rgba(109,40,217,0.4))'
                    : 'linear-gradient(180deg, rgba(139,92,246,0.3), rgba(109,40,217,0.2))',
              }}
            >
              {rankIdx + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
