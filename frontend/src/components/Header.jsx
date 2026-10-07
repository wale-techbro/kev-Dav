export default function Header({ onNewConversation, disabled = false }) {
  return (
    <header className="app-header">
      <a className="brand" href="/" aria-label="Torilo Academy Student Assistant home">
        <span className="brand-mark" aria-hidden="true">T</span>
        <span>
          <span className="brand-name">Torilo Academy</span>
          <span className="brand-product">Student Assistant</span>
        </span>
      </a>
      <button className="secondary-button" type="button" onClick={onNewConversation} disabled={disabled}>
        New conversation
      </button>
    </header>
  );
}
