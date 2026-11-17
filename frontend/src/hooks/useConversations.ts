import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchConversations,
  renameConversation,
  type Conversation,
} from "../api/chat";

const CONVERSATIONS_QUERY_KEY = ["conversations"] as const;

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: fetchConversations,
  });
}

export function useRenameConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      renameConversation(id, title),

    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<Conversation[]>(
        CONVERSATIONS_QUERY_KEY
      );
      queryClient.setQueryData<Conversation[]>(
        CONVERSATIONS_QUERY_KEY,
        (current) =>
          current?.map((c) =>
            c.id === id ? { ...c, title: title.trim() || null } : c
          ) ?? current
      );
      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(CONVERSATIONS_QUERY_KEY, context.previous);
      }
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },

    onSuccess: (conversation) => {
      queryClient.setQueryData<Conversation[]>(
        CONVERSATIONS_QUERY_KEY,
        (current) =>
          current?.map((c) => (c.id === conversation.id ? conversation : c)) ??
          current
      );
    },
  });
}
