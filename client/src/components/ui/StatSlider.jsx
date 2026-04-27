const STAT_LABELS = {
  iq: { label: 'IQ', icon: '🧠' },
  shooter: { label: 'Shooter', icon: '🎯' },
  partyAnimal: { label: 'Party Animal', icon: '🎉' },
  driver: { label: 'Driver', icon: '🏎' },
  strategist: { label: 'Strategist', icon: '♟' },
};

export default function StatSlider({ statKey, value, onChange, disabled = false }) {
  const { label, icon } = STAT_LABELS[statKey] || { label: statKey, icon: '⭐' };
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-muted shrink-0">
        {icon} {label}
      </span>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="flex-1 accent-purple"
      />
      <span className="w-6 text-right text-sm font-bold text-purple-light">{value}</span>
    </div>
  );
}

export { STAT_LABELS };
