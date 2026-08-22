import type { OrderStatus } from "../../api/orders";

/**
 * The four beats the design shows. "Ordered" isn't a stored status — it is
 * implied by the order existing at all, so it is always complete.
 */
const STEPS: { key: OrderStatus | "ordered"; label: string }[] = [
  { key: "ordered", label: "Ordered" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderTracker({ status }: { status: OrderStatus }) {
  // A cancelled order has no position on this line, so it doesn't get one.
  if (status === "cancelled") {
    return (
      <p className="text-sm text-[#777] mb-10">
        This order was cancelled and will not be delivered.
      </p>
    );
  }

  const currentIndex = STEPS.findIndex((step) => step.key === status);
  const reached = currentIndex === -1 ? 0 : currentIndex;
  const progress = reached / (STEPS.length - 1);

  return (
    <div
      className="mb-10 hidden md:block"
      role="img"
      aria-label={`Order progress: ${STEPS[reached].label}`}
    >
      <div className="relative flex justify-between">
        <div className="absolute top-3 left-0 w-full h-px bg-[#E5E5E5]" />
        <div
          className="absolute top-3 left-0 h-px bg-[#1A1A1A] origin-left transition-transform duration-700 ease-out"
          style={{ width: "100%", transform: `scaleX(${progress})` }}
        />
        {STEPS.map((step, index) => {
          const done = index <= reached;
          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center gap-2 bg-[#F9F7F4] px-2"
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                  done
                    ? "bg-[#1A1A1A] text-white"
                    : "bg-white text-[#CCC] border border-[#E5E5E5]"
                }`}
              >
                {done ? "✓" : ""}
              </span>
              <span
                className={`text-[10px] font-semibold tracking-[0.15em] uppercase ${
                  done ? "text-[#1A1A1A]" : "text-[#AAA]"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
