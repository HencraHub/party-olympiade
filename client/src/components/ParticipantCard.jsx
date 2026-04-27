import { STAT_LABELS } from "./ui/StatSlider.jsx";

const STAT_KEYS = Object.keys(STAT_LABELS);

export default function ParticipantCard({
  participant,
  rank,
  highlight = false,
}) {
  const { name, avatarBase64, stats = {} } = participant;

  return (
    <div
      className={`glass rounded-xl p-4 flex gap-4 items-start transition-all duration-300 ${
        highlight
          ? "border-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          : ""
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {avatarBase64 ? (
          <img
            src={avatarBase64}
            alt={name}
            className="w-14 h-14 rounded-full object-cover border-2 border-purple-500/40"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center text-2xl font-bold">
            {name[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {rank !== undefined && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-light">
              #{rank}
            </span>
          )}
          <span className="font-bold text-white truncate">{name}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-1">
          {STAT_KEYS.map((key) => {
            const { icon } = STAT_LABELS[key];
            const val = stats[key] ?? 5;
            return (
              <div key={key} className="text-center">
                <div className="text-xs text-muted">{icon}</div>
                <div className="text-xs font-bold text-white">{val}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
