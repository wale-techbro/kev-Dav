import type { ChatRequest, ChatResponse } from "../types/chat";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function sendMessage(
  request: ChatRequest,
  signal?: AbortSignal
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/CHAT_ENDPOINT`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    let message = "Unable to contact the assistant.";

    try {
      const error = await response.json();

      if (typeof error?.detail === "string") {
        message = error.detail;
      } else if (typeof error?.message === "string") {
        message = error.message;
      }
    } catch {
      // Keep generic message.
    }

    throw new Error(message);
  }

  const data = await response.json();

  if (!data || typeof data !== "object") {
    throw new Error("The assistant returned an invalid response.");
  }

  if (typeof data.answer !== "string") {
    throw new Error("The assistant response is missing an answer.");
  }

  return {
    answer: data.answer,
    conversation_id: data.conversation_id,
    sources: Array.isArray(data.sources) ? data.sources : [],
    metadata: data.metadata,
  };
}