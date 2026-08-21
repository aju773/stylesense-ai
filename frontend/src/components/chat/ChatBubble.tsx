// src/components/chat/ChatBubble.tsx
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../../hooks/useChat";

export default function ChatBubble({ role, content }: ChatMessage) {
  const isUser = role === "user";
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#6366F1]/10 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
          <span className="text-[#6366F1] text-sm">✦</span>
        </div>
      )}
      <div
        className={
          isUser
            ? "max-w-[85%] md:max-w-[70%] bg-[#1A1A1A] text-white p-4 rounded-2xl rounded-tr-sm shadow-sm"
            : "max-w-[85%] md:max-w-[70%] bg-[#F9F7F4] text-[#1A1A1A] p-4 rounded-2xl rounded-tl-sm shadow-sm [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1"
        }
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{content}</p>
        ) : (
          <div className="text-sm leading-relaxed">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
