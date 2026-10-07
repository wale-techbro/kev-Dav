import { useState } from "react";
import { MAX_MESSAGE_LENGTH } from "../utils/constants";

export default function InputBox({ onSubmit, loading = false }) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH && !loading;

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSend) return;
    onSubmit(trimmed);
    setValue("");
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form className="input-form" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="chat-message">Ask a question</label>
      <textarea
        id="chat-message"
        name="message"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question about Torilo Academy"
        maxLength={MAX_MESSAGE_LENGTH}
        rows={1}
        disabled={loading}
        aria-describedby="input-hint input-count"
      />
      <div className="input-footer">
        <span id="input-hint">Enter to send · Shift+Enter for a new line</span>
        <span id="input-count" aria-live="polite">{value.length}/{MAX_MESSAGE_LENGTH}</span>
        <button className="send-button" type="submit" disabled={!canSend} aria-label="Send message">
          Send
        </button>
      </div>
    </form>
  );
}
