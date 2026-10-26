import { Skeleton } from "@/components/ui/skeleton";

const COLS = ["w-28", "w-24", "w-16", "w-14", "w-16", "w-20", "w-24"];

export function PropertiesSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card" aria-busy="true">
      <div className="flex gap-4 border-b border-border px-3 py-2">
        {COLS.map((w, i) => (
          <Skeleton key={i} className={`h-3 ${w} bg-muted`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-border px-3 py-2 last:border-b-0">
          {COLS.map((w, i) => (
            <Skeleton key={i} className={`h-4 ${w} bg-muted/60`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default PropertiesSkeleton;
