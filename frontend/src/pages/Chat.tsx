// src/pages/Chat.tsx
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchConversationMessages } from "../api/chat";
import { useChat } from "../hooks/useChat";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import ConversationSidebar from "../components/chat/ConversationSidebar";
import ChatBubble from "../components/chat/ChatBubble";
import TypingIndicator from "../components/chat/TypingIndicator";
import ChatInput from "../components/chat/ChatInput";

export default function Chat() {
  useDocumentTitle("AI Stylist");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [historyConversationId, setHistoryConversationId] = useState<number | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { messages, isStreaming, sendMessage, clearMessages, conversationId } = useChat();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history } = useQuery({
    queryKey: ["conversation-messages", historyConversationId],
    queryFn: () => fetchConversationMessages(historyConversationId!),
    enabled: historyConversationId !== null,
  });

  function handleSelectConversation(id: number | null) {
    clearMessages();
    setActiveConversationId(id);
    setHistoryConversationId(id);
  }

  // Adopt a newly-created conversation's id once the backend assigns one,
  // and refresh the sidebar so it appears in the list. Deliberately does NOT
  // touch historyConversationId — that message is already in useChat's live
  // `messages`, so re-fetching it via REST would duplicate it.
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
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      products: m.products,
    }));

  const lastLive = messages[messages.length - 1];
  const showTyping = isStreaming && lastLive?.role === "assistant" && lastLive.content === "";
  const liveToRender = showTyping ? messages.slice(0, -1) : messages;
  const allMessages = [...historyMessages, ...liveToRender];

  return (
    <div className="flex w-full h-full min-h-0">
      <ConversationSidebar
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <section className="flex-1 flex flex-col h-full min-h-0 bg-white">
        <div className="md:hidden flex items-center px-4 py-3 border-b border-[#E5E5E5] flex-shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open conversation history"
            className="w-9 h-9 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F5F5F5] rounded-full transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <span className="text-xs font-semibold tracking-[0.1em] uppercase text-[#1A1A1A] ml-2">
            History
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-8 space-y-6">
          {allMessages.map((m, i) => (
            <ChatBubble
              key={i}
              {...m}
              isStreaming={isStreaming && i === allMessages.length - 1}
            />
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
