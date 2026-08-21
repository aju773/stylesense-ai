// src/components/chat/ConversationSidebar.tsx
import { useConversations } from "../../hooks/useConversations";

interface ConversationSidebarProps {
  activeConversationId: number | null;
  onSelectConversation: (id: number | null) => void;
}

export default function ConversationSidebar({
  activeConversationId,
  onSelectConversation,
}: ConversationSidebarProps) {
  const { data: conversations, isLoading } = useConversations();

  return (
    <aside className="hidden md:flex flex-col w-[280px] bg-[#F9F7F4] flex-shrink-0 h-full">
      <div className="px-6 py-8 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-[0.1em] uppercase text-[#1A1A1A]">
          History
        </h3>
        <button
          onClick={() => onSelectConversation(null)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-1">
        {isLoading && <p className="text-sm text-[#777]">Loading...</p>}
        {conversations?.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          return (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full text-left p-4 rounded-lg transition-colors relative ${
                isActive ? "bg-white shadow-sm" : "hover:bg-[#F5F5F5]"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1A1A1A] rounded-l" />
              )}
              <h4 className="text-sm font-medium text-[#1A1A1A] truncate">
                {conversation.title || "New conversation"}
              </h4>
              <p className="text-xs text-[#777] mt-1">
                {new Date(conversation.updated_at).toLocaleDateString()}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
