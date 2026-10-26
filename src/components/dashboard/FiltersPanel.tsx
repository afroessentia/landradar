import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useCounties } from "@/hooks/use-properties";
import { ALL_STATES, PRICE_MAX, PRICE_MIN, PRICE_PRESETS, activePricePreset, pruneCounties } from "@/lib/filters-url";
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
  const [price, setPrice] = useState<[number, number]>([filters.minPrice, filters.maxPrice]);
  const [acres, setAcres] = useState(filters.minAcreage);
  useEffect(() => setPrice([filters.minPrice, filters.maxPrice]), [filters.minPrice, filters.maxPrice]);
  const activePreset = activePricePreset(filters);
  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

  const { data: allCounties = [] } = useCounties();
  const activeCounties = allCounties.filter((c) => c.is_active);
  const visibleCounties = filters.states.length
    ? activeCounties.filter((c) => filters.states.includes(c.state))
    : activeCounties;
  const countyGroups = ALL_STATES.map((st) => ({ st, items: visibleCounties.filter((c) => c.state === st) })).filter(
    (g) => g.items.length,
  );
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
                onCheckedChange={() => {
                  const states = toggle(filters.states, s);
                  onChange({ states, counties: pruneCounties(filters.counties, states, activeCounties) });
                }}
              />
              <span className="font-mono text-xs text-foreground">{s}</span>
              <span className="truncate text-xs text-muted-foreground">{STATE_NAMES[s]}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section
        title="Condado"
        right={
          filters.counties.length > 0 ? (
            <button type="button" className="text-[11px] text-primary hover:underline" onClick={() => onChange({ counties: [] })}>
              Limpar ({filters.counties.length})
            </button>
          ) : undefined
        }
      >
        <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
          {countyGroups.length === 0 && <span className="text-xs text-muted-foreground">Nenhum condado ativo.</span>}
          {countyGroups.map((g) => (
            <div key={g.st}>
              <div className="px-1 font-mono text-[10px] text-muted-foreground">{g.st}</div>
              {g.items.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/40">
                  <Checkbox
                    checked={filters.counties.includes(c.id)}
                    onCheckedChange={() => onChange({ counties: toggle(filters.counties, c.id) })}
                  />
                  <span className="truncate text-xs text-foreground">{c.county_name}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Faixa de preço OTC"
        right={<span className="font-mono text-xs text-primary">{fmt(price[0])} a {fmt(price[1])}</span>}
      >
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="inline-flex whitespace-nowrap rounded-md border border-border p-0.5" role="group" aria-label="Atalhos de faixa de preço">
            {PRICE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={activePreset === p.id}
                onClick={() => onChange({ minPrice: p.min, maxPrice: p.max })}
                className={cn(
                  "rounded px-2 py-1 text-[11px] transition-colors",
                  activePreset === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={50}
          minStepsBetweenThumbs={0}
          value={price}
          onValueChange={(v) => v.length === 2 && setPrice([v[0]!, v[1]!])}
          onValueCommit={(v) => v.length === 2 && onChange({ minPrice: v[0]!, maxPrice: v[1]! })}
          aria-label="Faixa de preço OTC"
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
