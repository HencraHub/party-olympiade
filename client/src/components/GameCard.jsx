export default function GameCard({
  game,
  isCurrent = false,
  isScored = false,
  onClick,
}) {
  const { title, icon = "🎮", mode, imageBase64, rules, addons = {} } = game;

  return (
    <div
      onClick={onClick}
      className={`glass rounded-xl overflow-hidden transition-all duration-200 ${
        isCurrent
          ? "border-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.25)] scale-[1.01]"
          : "hover:border-white/20"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* Cover image */}
      {imageBase64 && (
        <div className="h-32 overflow-hidden">
          <img
            src={imageBase64}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="font-bold text-white leading-tight">{title}</h3>
              <span
                className={`badge text-xs mt-0.5 ${
                  mode === "team"
                    ? "bg-cyan-500/20 text-cyan"
                    : "bg-purple-500/20 text-purple-light"
                }`}
              >
                {mode === "team" ? "👥 Teams" : "⚔️ FFA"}
              </span>
            </div>
          </div>
          {isScored && (
            <span className="badge bg-green-500/20 text-green-400 shrink-0">
              ✅ Scored
            </span>
          )}
          {isCurrent && !isScored && (
            <span className="badge bg-yellow-500/20 text-yellow-400 shrink-0">
              ▶ Live
            </span>
          )}
        </div>

        {rules && (
          <p className="text-sm text-muted line-clamp-3 mb-2">{rules}</p>
        )}

        {/* Active add-ons */}
        <div className="flex flex-wrap gap-1 mt-2">
          {addons.drinkingGame?.enabled && (
            <span className="badge bg-orange-500/15 text-orange-400">
              🍺 Drinking
            </span>
          )}
          {addons.timeLimit > 0 && (
            <span className="badge bg-blue-500/15 text-blue-400">
              ⏱ {addons.timeLimit}min
            </span>
          )}
          {addons.equipment && (
            <span className="badge bg-gray-500/15 text-gray-400">
              🛠 Equipment
            </span>
          )}
          {addons.handicap && (
            <span className="badge bg-red-500/15 text-red-400">⚖ Handicap</span>
          )}
        </div>
      </div>
    </div>
  );
}
