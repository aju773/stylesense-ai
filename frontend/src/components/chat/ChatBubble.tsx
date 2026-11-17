import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../../hooks/useChat";
import PicksBlock from "./PicksBlock";

const MARKER_RE = /\s*\[\[product:\d+\]\]/g;
const WHY_BLOCK_RE = /\n*\[\[why:[\s\S]*$/;
function countPendingProducts(content: string): number {
  const ids = new Set<string>();
  for (const match of content.matchAll(/\[\[product:(\d+)\]\]/g)) {
    ids.add(match[1]);
  }
  return ids.size;
}

export default function ChatBubble({
  role,
  content,
  products,
  isStreaming,
}: ChatMessage & { isStreaming?: boolean }) {
  const isUser = role === "user";
  const displayContent = isUser
    ? content
    : content.replace(MARKER_RE, "").replace(WHY_BLOCK_RE, "").trimEnd();
  const pendingCount =
    !isUser && isStreaming && !products ? countPendingProducts(content) : 0;

  return (
    <div>
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
            </div>
          )}
        </div>
      </div>
      {!isUser && (
        <PicksBlock products={products} pendingCount={pendingCount} />
      )}
    </div>
  );
}
