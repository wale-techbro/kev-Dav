import SourceDisplay from "./SourceDisplay";

export default function Message({ message }) {
  const isUser = message.role === "user";
  return (
    <article className={`message message-${isUser ? "user" : "assistant"}`}>
      <div className="message-meta">
        <span className="message-role">{isUser ? "You" : "Torilo Assistant"}</span>
      </div>
      <div className="message-body">{message.content}</div>
      {!isUser && <SourceDisplay sources={message.sources || []} />}
    </article>
  );
}
