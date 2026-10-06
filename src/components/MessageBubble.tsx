import type { ChatMessage } from "../types/chat";
import { Sources } from "./Sources";

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  return (
    <article className={`message ${message.role}`}>
      <div className="message-role">
        {message.role === "user" ? "You" : "Assistant"}
      </div>

      <div className="message-content">
        {message.content}
      </div>

      {message.role === "assistant" &&
        message.sources &&
        message.sources.length > 0 && (
          <Sources sources={message.sources} />
        )}
    </article>
  );
}