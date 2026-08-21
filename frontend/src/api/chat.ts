// src/api/chat.ts
import api from "./axios";

export interface Conversation {
  id: number;
  title: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRecord {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  ai_provider_used: string | null;
  created_at: string;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const response = await api.get<Conversation[]>("/chat/conversations/");
  return response.data;
}

export async function fetchConversationMessages(
  conversationId: number
): Promise<ChatMessageRecord[]> {
  const response = await api.get<ChatMessageRecord[]>(
    `/chat/conversations/${conversationId}/messages/`
  );
  return response.data;
}
