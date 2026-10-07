export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");
export const CHAT_ENDPOINT = `${API_BASE_URL}/api/chat`;
export const MAX_MESSAGE_LENGTH = 8000;
export const CONVERSATION_ID_STORAGE_KEY = "torilo-chat-conversation-id";
