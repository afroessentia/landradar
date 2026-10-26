import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ALL_STATES } from "@/lib/filters-url";
import { STATE_NAMES, STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import { ALL_STATUSES, type PropertyFilters } from "@/types/property";

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-b border-border pb-3 last:border-b-0">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export function FiltersPanel({
  filters,
  onChange,
  onReset,
}: {
  filters: PropertyFilters;
  onChange: (patch: Partial<PropertyFilters>) => void;
  onReset: () => void;
}) {
  // Busca com debounce de 300ms
  const [q, setQ] = useState(filters.search);
  useEffect(() => setQ(filters.search), [filters.search]);
  useEffect(() => {
    if (q === filters.search) return;
    const t = setTimeout(() => onChange({ search: q }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Sliders: valor local durante o arraste, grava na URL ao soltar
  const [price, setPrice] = useState(filters.maxPrice);
  const [acres, setAcres] = useState(filters.minAcreage);
  useEffect(() => setPrice(filters.maxPrice), [filters.maxPrice]);
  useEffect(() => setAcres(filters.minAcreage), [filters.minAcreage]);

  return (
    <div className="space-y-3 text-sm">
      <Section title="Busca">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Parcel ID ou condado"
            className="h-8 pl-7 font-mono text-xs"
            aria-label="Buscar por Parcel ID ou condado"
          />
        </div>
      </Section>

      <Section title="Estado">
        <div className="grid grid-cols-2 gap-1">
          {ALL_STATES.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/40">
              <Checkbox
                checked={filters.states.includes(s)}
                onCheckedChange={() => onChange({ states: toggle(filters.states, s) })}
              />
              <span className="font-mono text-xs text-foreground">{s}</span>
              <span className="truncate text-xs text-muted-foreground">{STATE_NAMES[s]}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Preço máximo OTC" right={<span className="font-mono text-xs text-primary">${price}</span>}>
        <Slider
          min={100}
          max={1500}
          step={50}
          value={[price]}
          onValueChange={([v]) => setPrice(v ?? price)}
          onValueCommit={([v]) => v !== undefined && onChange({ maxPrice: v })}
          aria-label="Preço máximo OTC"
        />
      </Section>

      <Section title="Tamanho mínimo" right={<span className="font-mono text-xs text-primary">{acres.toFixed(2)} ac</span>}>
        <Slider
          min={0}
          max={10}
          step={0.25}
          value={[acres]}
          onValueChange={([v]) => setAcres(v ?? acres)}
          onValueCommit={([v]) => v !== undefined && onChange({ minAcreage: v })}
          aria-label="Tamanho mínimo em acres"
        />
      </Section>

      <Section title="Status do funil">
        <div className="space-y-0.5">
          {ALL_STATUSES.map((s) => {
            const meta = STATUS_META[s];
            return (
              <label key={s} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/40">
                <Checkbox
                  checked={filters.statuses.includes(s)}
                  onCheckedChange={() => {
                    const next = toggle(filters.statuses, s);
                    if (next.length) onChange({ statuses: next });
                  }}
                />
                <span className={cn("rounded border px-1.5 py-px text-[11px]", meta.badgeClass)}>{meta.label}</span>
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="Opções">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="f-gps" className="text-xs text-foreground">Apenas lotes com coordenadas GPS</Label>
          <Switch id="f-gps" checked={filters.onlyWithGps} onCheckedChange={(v) => onChange({ onlyWithGps: v })} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="f-fav" className="text-xs text-foreground">Somente favoritos</Label>
          <Switch id="f-fav" checked={filters.onlyFavorites} onCheckedChange={(v) => onChange({ onlyFavorites: v })} />
        </div>
      </Section>

      <Button variant="outline" size="sm" className="h-8 w-full" onClick={onReset}>
        <X className="h-4 w-4" /> Limpar filtros
      </Button>
    </div>
  );
}
