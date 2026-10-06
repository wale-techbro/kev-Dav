import { useCallback, useState } from "react";
import { sendMessage } from "../services/api";
import type { ChatMessage } from "../types/chat";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (content: string) => {
      const message = content.trim();

      if (!message || loading) return;

      setError(null);

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };

      setMessages((current) => [...current, userMessage]);
      setLoading(true);

      try {
        const result = await sendMessage({
          message,
          conversation_id: conversationId,
        });

        if (result.conversation_id) {
          setConversationId(result.conversation_id);
        }

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.answer,
          sources: result.sources,
          timestamp: new Date().toISOString(),
        };

        setMessages((current) => [...current, assistantMessage]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [conversationId, loading]
  );

  const retry = useCallback(() => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (lastUserMessage) {
      send(lastUserMessage.content);
    }
  }, [messages, send]);

  return {
    messages,
    loading,
    error,
    send,
    retry,
  };
}