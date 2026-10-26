import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperties } from "@/hooks/use-properties";
import type { PropertyFilters } from "@/types/property";

export function ResultsCounter({ filters }: { filters: PropertyFilters }) {
  const { data, isLoading, isError } = useProperties(filters);

  if (isLoading) return <Skeleton className="h-4 w-40 bg-muted" />;
  if (isError || !data) return <span className="text-xs text-muted-foreground">Não foi possível contar os lotes.</span>;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="text-foreground">
        <span className="font-mono font-semibold text-primary">{data.total.toLocaleString("en-US")}</span>{" "}
        {data.total === 1 ? "lote encontrado" : "lotes encontrados"}
      </span>
      {data.excludedWithoutPrice > 0 && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Info className="h-3 w-3" />
          <span className="font-mono">{data.excludedWithoutPrice}</span> lotes sem preço ficaram de fora do filtro de preço
        </span>
      )}
    </div>
  );
}
