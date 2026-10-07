import { postChat } from "./api";
import { normalizeChatResponse } from "../utils/formatResponse";

export async function sendChatMessage(message, conversationId, options = {}) {
  const payload = { message };
  if (conversationId) payload.conversation_id = conversationId;

  const response = await postChat(payload, options);
  return normalizeChatResponse(response);
}
