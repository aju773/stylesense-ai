// src/hooks/useConversations.ts
import { useQuery } from "@tanstack/react-query";
import { fetchConversations, type Conversation } from "../api/chat";

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });
}
