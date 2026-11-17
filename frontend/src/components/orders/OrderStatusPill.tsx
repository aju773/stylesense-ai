import type { OrderStatus } from "../../api/orders";

const TONES: Record<OrderStatus, { dot: string; text: string; bg: string }> = {
  processing: { dot: "bg-[#B08442]", text: "text-[#8A6A34]", bg: "bg-[#FBF3E5]" },
  shipped: { dot: "bg-[#3B6FB0]", text: "text-[#2F5A8F]", bg: "bg-[#EDF3FA]" },
  delivered: { dot: "bg-[#2D8A4E]", text: "text-[#2D8A4E]", bg: "bg-[#E8F3EB]" },
  cancelled: { dot: "bg-[#777]", text: "text-[#777]", bg: "bg-[#F4F4F4]" },
};

export default function OrderStatusPill({
  status,
  label,
}: {
  status: OrderStatus;
  label: string;
}) {
  const tone = TONES[status] ?? TONES.processing;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.15em] uppercase ${tone.bg} ${tone.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      {label}
    </span>
  );
}
