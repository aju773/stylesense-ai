// src/components/chat/ChatBubble.tsx
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../../hooks/useChat";
import ChatProductStrip from "./ChatProductStrip";

// The AI cites catalog products with [[product:12]] markers. They are a
// machine-readable contract, not prose — the backend turns them into the card
// payload, and they must never reach the reader's eyes. Stripped here rather
// than server-side so the markers survive in ChatMessage.content, which is what
// lets history rebuild card ordering later.
const MARKER_RE = /\s*\[\[product:\d+\]\]/g;

export default function ChatBubble({ role, content, products }: ChatMessage) {
  const isUser = role === "user";
  const displayContent = isUser ? content : content.replace(MARKER_RE, "");
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
            <ReactMarkdown>{displayContent}</ReactMarkdown>
            {products && products.length > 0 && (
              <ChatProductStrip products={products} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
