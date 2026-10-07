export default function ErrorMessage({ message, onRetry, retryDisabled = false }) {
  if (!message) return null;
  return (
    <div className="error-message" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="text-button" onClick={onRetry} disabled={retryDisabled}>
          Retry
        </button>
      )}
    </div>
  );
}
