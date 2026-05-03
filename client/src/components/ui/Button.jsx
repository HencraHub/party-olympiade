export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base = "btn-" + variant;
  const sizeClass =
    size === "sm"
      ? "text-sm !px-4 !py-2"
      : size === "lg"
        ? "text-lg !px-8 !py-4"
        : "";
  return (
    <button className={`${base} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
