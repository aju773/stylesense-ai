// src/pages/Chat.tsx
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchConversationMessages } from "../api/chat";
import { useChat } from "../hooks/useChat";
import ConversationSidebar from "../components/chat/ConversationSidebar";
import ChatBubble from "../components/chat/ChatBubble";
import TypingIndicator from "../components/chat/TypingIndicator";
import ChatInput from "../components/chat/ChatInput";

export default function Chat() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const { messages, isStreaming, sendMessage, clearMessages, conversationId } = useChat();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history } = useQuery({
    queryKey: ["conversation-messages", activeConversationId],
    queryFn: () => fetchConversationMessages(activeConversationId!),
    enabled: activeConversationId !== null,
  });

  function handleSelectConversation(id: number | null) {
    clearMessages();
    setActiveConversationId(id);
  }

  // Adopt a newly-created conversation's id once the backend assigns one,
  // and refresh the sidebar so it appears in the list.
  useEffect(() => {
    if (conversationId && Number(conversationId) !== activeConversationId) {
      setActiveConversationId(Number(conversationId));
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }, [conversationId, activeConversationId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const historyMessages = (history ?? [])
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const lastLive = messages[messages.length - 1];
  const showTyping = isStreaming && lastLive?.role === "assistant" && lastLive.content === "";
  const liveToRender = showTyping ? messages.slice(0, -1) : messages;
  const allMessages = [...historyMessages, ...liveToRender];

  return (
    <div className="flex w-full h-screen">
      <ConversationSidebar
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
      />
      <section className="flex-1 flex flex-col h-full bg-white">
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          {allMessages.map((m, i) => (
            <ChatBubble key={i} role={m.role} content={m.content} />
          ))}
          {showTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
        <div className="px-6 pb-6">
          <ChatInput
            disabled={isStreaming}
            onSend={(text) => sendMessage(text, activeConversationId ?? undefined)}
          />
        </div>
      </section>
    </div>
  );
}
