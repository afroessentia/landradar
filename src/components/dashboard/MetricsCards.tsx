import { Skeleton } from "@/components/ui/skeleton";
import { useMetrics, type Metrics } from "@/hooks/use-properties";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/types/property";

export interface MetricFilter {
  status?: PropertyStatus;
  maxPrice?: number;
}

interface CardDef {
  key: keyof Metrics;
  label: string;
  filter: { status: PropertyStatus; maxPrice?: number };
}

const CARDS: CardDef[] = [
  { key: "cheapNew", label: "Terrenos < $600 detectados", filter: { status: "new_detected", maxPrice: 600 } },
  { key: "dueDiligence", label: "Em Due Diligence", filter: { status: "due_diligence" } },
  { key: "purchased", label: "Comprados", filter: { status: "purchased" } },
  { key: "listed", label: "Anunciados", filter: { status: "listed_for_sale" } },
];

export function isCardActive(card: CardDef["filter"], current: MetricFilter) {
  return (
    current.status === card.status &&
    (card.maxPrice === undefined ? current.maxPrice === undefined : current.maxPrice === card.maxPrice)
  );
}

export function MetricsCards({
  current,
  onSelect,
}: {
  current: MetricFilter;
  onSelect: (next: MetricFilter) => void;
}) {
  const { data, isLoading } = useMetrics();

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {CARDS.map((c) => {
        const active = isCardActive(c.filter, current);
        return (
          <button
            key={c.key}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? {} : c.filter)}
            className={cn(
              "rounded-md border bg-card px-3 py-2 text-left transition-colors hover:border-primary/60",
              active ? "border-primary" : "border-border",
            )}
          >
            <div className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</div>
            {isLoading ? (
              <Skeleton className="mt-1 h-7 w-12 bg-muted" />
            ) : (
              <div className="font-mono text-2xl font-semibold leading-tight text-primary">
                {data ? data[c.key].toLocaleString("en-US") : "—"}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
