import { useEffect, useRef, useState } from "react";
import { useConversations, useRenameConversation } from "../../hooks/useConversations";
import type { Conversation } from "../../api/chat";

const COLLAPSE_STORAGE_KEY = "chat.sidebarCollapsed";
const TITLE_MAX_LENGTH = 50;

interface ConversationSidebarProps {
  activeConversationId: number | null;
  onSelectConversation: (id: number | null) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={direction === "right" ? "rotate-180" : ""}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

interface ConversationRowProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
}

function ConversationRow({ conversation, isActive, onSelect }: ConversationRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.title ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const rename = useRenameConversation();

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEditing(e: React.MouseEvent) {
    e.stopPropagation();
    setDraft(conversation.title ?? "");
    setIsEditing(true);
  }

  function commit() {
    setIsEditing(false);
    if (draft.trim() !== (conversation.title ?? "")) {
      rename.mutate({ id: conversation.id, title: draft });
    }
  }

  function cancel() {
    setDraft(conversation.title ?? "");
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="w-full text-left p-4 rounded-lg bg-white shadow-sm relative">
        <input
          ref={inputRef}
          value={draft}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          className="w-full text-sm font-medium text-[#1A1A1A] bg-transparent outline-none border-b border-[#1A1A1A]"
        />
        <p className="text-xs text-[#777] mt-1">
          {new Date(conversation.updated_at).toLocaleDateString()}
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={onSelect}
      className={`group w-full text-left p-4 rounded-lg transition-colors relative ${
        isActive ? "bg-white shadow-sm" : "hover:bg-[#F5F5F5]"
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1A1A1A] rounded-l" />
      )}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-[#1A1A1A] truncate">
          {conversation.title || "New conversation"}
        </h4>
        <span
          role="button"
          tabIndex={0}
          aria-label="Rename conversation"
          onClick={startEditing}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              startEditing(e as unknown as React.MouseEvent);
            }
          }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 text-[#777] hover:text-[#1A1A1A] p-1 -m-1 rounded transition-opacity"
        >
          <PencilIcon />
        </span>
      </div>
      <p className="text-xs text-[#777] mt-1">
        {new Date(conversation.updated_at).toLocaleDateString()}
      </p>
    </button>
  );
}

function SidebarContent({
  activeConversationId,
  onSelectConversation,
  extraHeaderControl,
}: {
  activeConversationId: number | null;
  onSelectConversation: (id: number | null) => void;
  extraHeaderControl?: React.ReactNode;
}) {
  const { data: conversations, isLoading } = useConversations();

  return (
    <div className="w-[280px] h-full flex flex-col">
      <div className="px-6 py-8 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-[0.1em] uppercase text-[#1A1A1A]">
          History
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectConversation(null)}
            aria-label="New conversation"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors"
          >
            +
          </button>
          {extraHeaderControl}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-1">
        {isLoading && <p className="text-sm text-[#777]">Loading...</p>}
        {conversations?.map((conversation) => (
          <ConversationRow
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onSelect={() => onSelectConversation(conversation.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function ConversationSidebar({
  activeConversationId,
  onSelectConversation,
  mobileOpen,
  onCloseMobile,
}: ConversationSidebarProps) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true"
  );

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseMobile();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen, onCloseMobile]);

  function selectAndCloseMobile(id: number | null) {
    onSelectConversation(id);
    onCloseMobile();
  }

  return (
    <>
      <div className="hidden md:block relative flex-shrink-0 h-full">
        <aside
          className={`h-full bg-[#F9F7F4] overflow-hidden transition-[width] duration-300 ease-in-out ${
            collapsed ? "w-0" : "w-[280px]"
          }`}
        >
          <SidebarContent
            activeConversationId={activeConversationId}
            onSelectConversation={onSelectConversation}
          />
        </aside>
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Show conversation history" : "Hide conversation history"}
          className="absolute top-1/2 -right-3 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-[#E5E5E5] text-[#777] hover:text-[#1A1A1A] shadow-sm transition-colors"
        >
          <ChevronIcon direction={collapsed ? "right" : "left"} />
        </button>
      </div>

      <div
        onClick={onCloseMobile}
        aria-hidden="true"
        className={`md:hidden fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Conversation history"
        aria-hidden={!mobileOpen}
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-[#F9F7F4] shadow-2xl transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          activeConversationId={activeConversationId}
          onSelectConversation={selectAndCloseMobile}
          extraHeaderControl={
            <button
              onClick={onCloseMobile}
              aria-label="Close conversation history"
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#777] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] transition-colors"
            >
              ✕
            </button>
          }
        />
      </aside>
    </>
  );
}
