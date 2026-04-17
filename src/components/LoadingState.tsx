type SpinnerSize = "sm" | "md" | "lg";

export function Spinner({
  label,
  size = "md",
  className,
}: {
  label: string;
  size?: SpinnerSize;
  className?: string;
}) {
  const classes = ["loading-spinner", `loading-spinner--${size}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes} role="status" aria-label={label}>
      <span className="loading-spinner-ring" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PanelSkeleton({
  label,
  rows = 4,
}: {
  label: string;
  rows?: number;
}) {
  return (
    <div className="loading-panel-skeleton" role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="loading-skeleton loading-skeleton--title" aria-hidden />
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className={`loading-skeleton ${idx === rows - 1 ? "loading-skeleton--short" : ""}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function BlockingLoadingOverlay({
  active,
  label,
  className,
}: {
  active: boolean;
  label: string;
  className?: string;
}) {
  if (!active) {
    return null;
  }
  const classes = ["loading-blocking-overlay", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} role="status" aria-live="assertive">
      <div className="loading-blocking-overlay-card">
        <Spinner label={label} size="lg" />
        <p className="loading-blocking-overlay-text">{label}</p>
      </div>
    </div>
  );
}
