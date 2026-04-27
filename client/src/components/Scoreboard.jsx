const MEDAL = ['🥇', '🥈', '🥉'];

export default function Scoreboard({ leaderboard = [], participants = [], myName = null, compact = false }) {
  const gamesPlayed = leaderboard.reduce((max, p) => Math.max(max, p.wins), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted border-b border-white/10">
            <th className="pb-2 text-left font-semibold w-8">#</th>
            <th className="pb-2 text-left font-semibold">Player</th>
            <th className="pb-2 text-right font-semibold text-cyan">Total</th>
            {!compact && (
              <>
                <th className="pb-2 text-right font-semibold">Base</th>
                <th className="pb-2 text-right font-semibold">Bonus</th>
                <th className="pb-2 text-right font-semibold">Wins</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, i) => {
            const participant = participants.find((p) => p.name === entry.name);
            const isMe = entry.name === myName;
            const medal = MEDAL[i];

            return (
              <tr
                key={entry.name}
                className={`border-b border-white/5 transition-colors ${
                  isMe ? 'bg-purple-500/10' : 'hover:bg-white/3'
                }`}
              >
                <td className="py-2.5 pr-2 text-center">
                  {medal || <span className="text-muted font-mono">{i + 1}</span>}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    {participant?.avatarBase64 ? (
                      <img
                        src={participant.avatarBase64}
                        alt={entry.name}
                        className="w-7 h-7 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center text-xs font-bold">
                        {entry.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className={`font-medium ${isMe ? 'text-purple-light' : 'text-white'}`}>
                      {entry.name}
                      {isMe && <span className="ml-1 text-xs text-purple-400">(you)</span>}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-right font-bold text-white">{entry.total}</td>
                {!compact && (
                  <>
                    <td className="py-2.5 text-right text-muted">{entry.base}</td>
                    <td className={`py-2.5 text-right font-medium ${entry.bonus > 0 ? 'text-green-400' : entry.bonus < 0 ? 'text-pink-400' : 'text-muted'}`}>
                      {entry.bonus > 0 ? `+${entry.bonus}` : entry.bonus}
                    </td>
                    <td className="py-2.5 text-right text-muted">{entry.wins}</td>
                  </>
                )}
              </tr>
            );
          })}
          {leaderboard.length === 0 && (
            <tr>
              <td colSpan={compact ? 3 : 6} className="py-6 text-center text-muted">
                No scores yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
