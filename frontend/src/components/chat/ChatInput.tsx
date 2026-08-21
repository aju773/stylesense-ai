// src/components/chat/ChatInput.tsx
import { useState } from "react";
import type { KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-end gap-2 bg-[#F9F7F4] p-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Describe your style needs..."
        rows={1}
        className="flex-1 bg-transparent border-none outline-none resize-none py-3 px-2 text-sm text-[#1A1A1A] placeholder:text-[#AAA] max-h-[120px] overflow-y-auto disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="w-12 h-12 flex flex-shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ↑
      </button>
    </div>
  );
}
