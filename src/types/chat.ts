export interface Source {
  title?: string;
  document?: string;
  page?: number;
  section?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  answer: string;
  conversation_id?: string;
  sources?: Source[];
  metadata?: Record<string, unknown>;
}