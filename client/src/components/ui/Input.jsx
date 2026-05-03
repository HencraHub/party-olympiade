export default function Input({ label, error, className = "", ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <input
        className={`input-field ${error ? "border-pink-500" : ""} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-pink-400">{error}</p>}
    </div>
  );
}
