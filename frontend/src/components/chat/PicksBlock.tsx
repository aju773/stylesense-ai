import type { ChatProductCard } from "../../api/chat";
import ProductCard from "../products/ProductCard";

function Skeletons({ n }: { n: number }) {
  return (
    <>
      <div className="hidden grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-x-5 gap-y-7 sm:grid">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/5] rounded-lg bg-[#F5F5F5]" />
            <div className="mt-2.5 h-2 w-1/3 bg-[#F5F5F5]" />
            <div className="mt-2 h-3 w-4/5 bg-[#F5F5F5]" />
            <div className="mt-2 h-2 w-1/2 bg-[#F5F5F5]" />
          </div>
        ))}
      </div>
      <div className="divide-y divide-[#E5E5E5] sm:hidden">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="flex animate-pulse gap-4 py-4 first:pt-0">
            <div className="aspect-[4/5] w-[104px] shrink-0 rounded-lg bg-[#F5F5F5]" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-2 w-1/4 bg-[#F5F5F5]" />
              <div className="h-3 w-3/5 bg-[#F5F5F5]" />
              <div className="h-2 w-full bg-[#F5F5F5]" />
              <div className="h-2 w-4/5 bg-[#F5F5F5]" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function PicksBlock({
  products,
  pendingCount = 0,
}: {
  products?: ChatProductCard[];
  pendingCount?: number;
}) {
  const count = products?.length ?? pendingCount;
  if (count === 0) return null;

  return (
    <div className="ml-11 mt-4 border-l-2 border-[#6366F1]/30 pl-5">
      <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-[#777]">
        {count} pick{count === 1 ? "" : "s"} for you
      </p>
      {!products ? (
        <Skeletons n={count} />
      ) : (
        <>
          <div className="hidden grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-x-5 gap-y-7 sm:grid">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                reason={p.reason}
                showAddToBag
                saveSource="ai"
                layout="grid"
              />
            ))}
          </div>
          <div className="divide-y divide-[#E5E5E5] sm:hidden">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                reason={p.reason}
                showAddToBag
                saveSource="ai"
                layout="row"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
