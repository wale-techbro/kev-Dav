import { FormEvent, useState } from "react";
import { useChat } from "../hooks/useChat";
import { MessageBubble } from "./MessageBubble";

export function Chat() {
  const [input, setInput] = useState("");
  const { messages, loading, error, send, retry } = useChat();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const value = input.trim();

    if (!value || loading) return;

    setInput("");
    await send(value);
  }

  return (
    <main className="chat-container">
      <header className="chat-header">
        <div>
          <h1>Torilo AI Student Assistant</h1>
          <p>Ask questions about your student resources.</p>
        </div>
      </header>

      <section className="messages" aria-live="polite">
        {messages.length === 0 && !loading && (
          <div className="empty-state">
            <h2>How can I help?</h2>
            <p>
              Ask a question about your courses, policies, resources,
              or student information.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
          />
        ))}

        {loading && (
          <div className="loading-message">
            <span>Assistant is thinking...</span>
          </div>
        )}

        {error && (
          <div className="error-message" role="alert">
            <span>{error}</span>
            <button onClick={retry}>Retry</button>
          </div>
        )}
      </section>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the assistant..."
          disabled={loading}
          aria-label="Message"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </main>
  );
}