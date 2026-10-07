import { useEffect, useRef } from "react";
import Loading from "./Loading";
import Message from "./Message";

export default function ChatWindow({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, loading]);

  return (
    <section className="chat-window" aria-label="Conversation">
      {messages.length === 0 ? (
        <div className="empty-state">
          <p className="empty-kicker">Student support</p>
          <h1>What would you like to know?</h1>
          <p>Ask a question. Answers and sources will come from the assistant service.</p>
        </div>
      ) : (
        <div className="message-list" aria-live="polite" aria-relevant="additions text">
          {messages.map((message) => <Message key={message.id} message={message} />)}
        </div>
      )}
      {loading && <Loading />}
      <div ref={bottomRef} />
    </section>
  );
}
