import { Skeleton } from "@/components/ui/skeleton";
import { useMetrics, type Metrics } from "@/hooks/use-properties";
import { cn } from "@/lib/utils";
import { DEFAULT_FILTERS, type PropertyFilters, type PropertyStatus } from "@/types/property";

interface CardDef {
  key: keyof Metrics;
  label: string;
  status: PropertyStatus;
  maxPrice?: number;
}

const CARDS: CardDef[] = [
  { key: "cheapNew", label: "Terrenos < $600 detectados", status: "new_detected", maxPrice: 600 },
  { key: "dueDiligence", label: "Em Due Diligence", status: "due_diligence" },
  { key: "purchased", label: "Comprados", status: "purchased" },
  { key: "listed", label: "Anunciados", status: "listed_for_sale" },
];

function isActive(c: CardDef, f: PropertyFilters) {
  const onlyThis = f.statuses.length === 1 && f.statuses[0] === c.status;
  if (!onlyThis) return false;
  return c.maxPrice !== undefined ? f.maxPrice === c.maxPrice : f.maxPrice !== 600 || c.status !== "new_detected";
}

export function MetricsCards({
  filters,
  onChange,
}: {
  filters: PropertyFilters;
  onChange: (patch: Partial<PropertyFilters>) => void;
}) {
  const { data, isLoading } = useMetrics();

  function click(c: CardDef) {
    if (isActive(c, filters)) {
      onChange({
        statuses: DEFAULT_FILTERS.statuses,
        ...(c.maxPrice !== undefined ? { maxPrice: DEFAULT_FILTERS.maxPrice } : {}),
      });
    } else {
      onChange({
        statuses: [c.status],
        ...(c.maxPrice !== undefined ? { maxPrice: c.maxPrice } : {}),
      });
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {CARDS.map((c) => {
        const active = isActive(c, filters);
        return (
          <button
            key={c.key}
            type="button"
            aria-pressed={active}
            onClick={() => click(c)}
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
