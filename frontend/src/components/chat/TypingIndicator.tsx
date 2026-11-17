export default function TypingIndicator() {
  return (
    <div className="flex w-full justify-start">
      <div className="w-8 h-8 rounded-full bg-[#6366F1]/10 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
        <span className="text-[#6366F1] text-sm">✦</span>
      </div>
      <div className="bg-[#F9F7F4] px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#6366F1]/60 animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-[#6366F1]/60 animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-[#6366F1]/60 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
