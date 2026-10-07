export default function Loading() {
  return (
    <div className="loading-status" role="status" aria-live="polite">
      <span className="loading-indicator" aria-hidden="true" />
      <span>Checking approved information…</span>
    </div>
  );
}
