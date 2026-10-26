import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ClipboardCheck,
  Map as MapIcon,
  RotateCw,
  Satellite,
  ShoppingCart,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PropertiesSkeleton } from "@/components/PropertiesSkeleton";
import { useProperties, useUpdateProperty } from "@/hooks/use-properties";
import { REJECTION_REASONS, STATUS_META, type RejectionReason } from "@/lib/status";
import { cn } from "@/lib/utils";
import { ALL_STATUSES, type Property, type PropertyFilters, type PropertySortBy, type PropertyStatus } from "@/types/property";

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const place = (p: Property) => `${p.state ?? "—"} · ${p.county_name ?? "—"}`;

function copyParcel(id: string) {
  navigator.clipboard
    .writeText(id)
    .then(() => toast.success("Parcel ID copiado"))
    .catch(() => toast.error("Não foi possível copiar"));
}

function Margin({ p }: { p: Property }) {
  if (p.otc_price == null || p.est_margin == null) return <span className="text-muted-foreground">-</span>;
  const pct = p.otc_price > 0 ? (p.est_margin / p.otc_price) * 100 : null;
  return (
    <span className={cn("font-mono", p.est_margin >= 0 ? "text-primary" : "text-destructive")}>
      {p.est_margin < 0 ? "-" : ""}
      {usd(Math.abs(p.est_margin))}
      {pct !== null && <span className="ml-1 text-[11px] opacity-80">({pct.toFixed(0)}%)</span>}
    </span>
  );
}

function Price({ p }: { p: Property }) {
  return p.otc_price == null ? (
    <span className="text-muted-foreground">sem preço</span>
  ) : (
    <span className="font-mono">{usd(p.otc_price)}</span>
  );
}

function ActionIcon({
  icon: Icon,
  label,
  disabledHint,
  href,
  onClick,
}: {
  icon: typeof MapIcon;
  label: string;
  disabledHint: string;
  href?: string | null;
  onClick?: () => void;
}) {
  const disabled = !onClick && !href;
  const cls = "h-7 w-7 text-muted-foreground hover:text-primary";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          {onClick ? (
            <Button variant="ghost" size="icon" className={cls} aria-label={label} onClick={onClick}>
              <Icon className="h-4 w-4" />
            </Button>
          ) : disabled ? (
            <Button variant="ghost" size="icon" className={cls} aria-label={label} disabled>
              <Icon className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className={cls} asChild>
              <a href={href!} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <Icon className="h-4 w-4" />
              </a>
            </Button>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>{disabled ? disabledHint : label}</TooltipContent>
    </Tooltip>
  );
}

function Actions({ p, onDD }: { p: Property; onDD: () => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <ActionIcon icon={MapIcon} label="Abrir GIS" disabledHint="GIS não configurado para este condado" href={p.gis_url} />
      <ActionIcon icon={Satellite} label="Satélite / GPS" disabledHint="Sem coordenadas" href={p.satellite_url} />
      <ActionIcon
        icon={ShoppingCart}
        label="Comprar oficial"
        disabledHint="Sem link de compra"
        href={p.direct_buy_url ?? p.portal_buy_url}
      />
      <ActionIcon icon={ClipboardCheck} label="Due Diligence" disabledHint="" onClick={onDD} />
    </div>
  );
}

function StatusSelect({ p, onChange }: { p: Property; onChange: (s: PropertyStatus) => void }) {
  const meta = STATUS_META[p.status];
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={p.status} onValueChange={(v) => v !== p.status && onChange(v as PropertyStatus)}>
        <SelectTrigger
          className={cn("h-6 w-auto gap-1 rounded border px-1.5 py-0 text-[11px] font-medium", meta.badgeClass)}
          aria-label="Status"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ALL_STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {STATUS_META[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FavStar({ p, onToggle }: { p: Property; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={p.favorite ? "Remover dos favoritos" : "Marcar como favorito"}
      aria-pressed={p.favorite}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="grid h-7 w-7 place-items-center rounded hover:bg-muted/50"
    >
      <Star className={cn("h-4 w-4", p.favorite ? "fill-primary text-primary" : "text-muted-foreground")} />
    </button>
  );
}

function RejectDialog({
  property,
  onCancel,
  onConfirm,
}: {
  property: Property | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState<RejectionReason | "">("");
  const [other, setOther] = useState("");
  const valid = reason !== "" && (reason !== "other" || other.trim().length > 0);

  function close() {
    setReason("");
    setOther("");
    onCancel();
  }

  return (
    <Dialog open={!!property} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rejeitar lote</DialogTitle>
          <DialogDescription>
            {property ? `${place(property)} · ${property.parcel_id}` : ""}. Informe o motivo da rejeição.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Motivo</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as RejectionReason)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-xs">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {reason === "other" && (
            <div className="space-y-1">
              <Label htmlFor="reject-other" className="text-xs">Descreva o motivo</Label>
              <Textarea id="reject-other" value={other} onChange={(e) => setOther(e.target.value)} rows={3} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={close}>Cancelar</Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!valid}
            onClick={() => {
              const value = reason === "other" ? other.trim() : reason;
              setReason("");
              setOther("");
              onConfirm(value);
            }}
          >
            Rejeitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SortHead({
  label,
  col,
  filters,
  onSort,
}: {
  label: string;
  col: PropertySortBy;
  filters: PropertyFilters;
  onSort: (c: PropertySortBy) => void;
}) {
  const active = filters.sortBy === col;
  const Icon = !active ? ArrowUpDown : filters.sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className="sticky top-0 z-10 bg-card px-2 text-right font-medium" aria-sort={active ? (filters.sortDir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-primary")}
      >
        {label} <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

export function PropertiesTable({
  filters,
  onReset,
  onNavigate,
}: {
  filters: PropertyFilters;
  onReset: () => void;
  onNavigate: (next: PropertyFilters) => void;
}) {
  const { data, isLoading, isError, refetch, isFetching } = useProperties(filters);
  const update = useUpdateProperty();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Property | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const selected = data?.rows.find((r) => r.id === selectedId) ?? null;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / filters.pageSize)) : 1;

  function changeStatus(p: Property, s: PropertyStatus) {
    if (s === "rejected") return setRejecting(p);
    update.mutate({ id: p.id, patch: { status: s, rejection_reason: null } });
  }
  function toggleFav(p: Property) {
    update.mutate({ id: p.id, patch: { favorite: !p.favorite } });
  }
  function sort(col: PropertySortBy) {
    const dir = filters.sortBy === col && filters.sortDir === "desc" ? "asc" : "desc";
    onNavigate({ ...filters, sortBy: col, sortDir: dir, page: 0 });
  }
  function goPage(page: number) {
    onNavigate({ ...filters, page });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (isLoading) return <PropertiesSkeleton />;
  if (isError || !data)
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-border bg-card p-6 text-center">
        <span className="text-sm text-muted-foreground">Não foi possível carregar os lotes.</span>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RotateCw className="h-4 w-4" /> Tentar de novo
        </Button>
      </div>
    );
  if (data.rows.length === 0)
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-border bg-card p-6 text-center">
        <span className="text-sm text-muted-foreground">Nenhum lote com esses filtros</span>
        <Button size="sm" variant="outline" onClick={onReset}>Limpar filtros</Button>
      </div>
    );

  return (
    <TooltipProvider delayDuration={200}>
      <div ref={topRef} className="scroll-mt-16" />

      {/* Desktop: tabela */}
      <div className="hidden max-h-[70vh] overflow-auto rounded-md border border-border bg-card md:block">
        <table className="w-full border-collapse text-xs">
          <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr className="h-9 border-b border-border">
              <th className="sticky top-0 z-10 w-9 bg-card px-2" aria-label="Favorito" />
              <th className="sticky top-0 z-10 bg-card px-2 text-left font-medium">Estado / Condado</th>
              <th className="sticky top-0 z-10 bg-card px-2 text-left font-medium">Parcel ID</th>
              <SortHead label="Acres" col="acreage" filters={filters} onSort={sort} />
              <SortHead label="Preço OTC" col="otc_price" filters={filters} onSort={sort} />
              <SortHead label="Margem est." col="est_margin" filters={filters} onSort={sort} />
              <th className="sticky top-0 z-10 bg-card px-2 text-left font-medium">Status</th>
              <th className="sticky top-0 z-10 bg-card px-2 text-left font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className={cn(isFetching && "opacity-70")}>
            {data.rows.map((p) => (
              <tr
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="h-11 cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-2"><FavStar p={p} onToggle={() => toggleFav(p)} /></td>
                <td className="whitespace-nowrap px-2 text-foreground">{place(p)}</td>
                <td className="px-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyParcel(p.parcel_id);
                    }}
                    className="font-mono text-foreground hover:text-primary"
                    title="Copiar Parcel ID"
                  >
                    {p.parcel_id}
                  </button>
                </td>
                <td className="px-2 text-right font-mono">{p.acreage ?? "—"}</td>
                <td className="px-2 text-right"><Price p={p} /></td>
                <td className="whitespace-nowrap px-2 text-right"><Margin p={p} /></td>
                <td className="px-2"><StatusSelect p={p} onChange={(s) => changeStatus(p, s)} /></td>
                <td className="px-2"><Actions p={p} onDD={() => setSelectedId(p.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="space-y-2 md:hidden">
        {data.rows.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className="cursor-pointer space-y-2 rounded-md border border-border bg-card p-3"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <div className="flex min-w-0 items-center gap-1">
                <FavStar p={p} onToggle={() => toggleFav(p)} />
                <span className="truncate text-sm text-foreground">{place(p)}</span>
              </div>
              <StatusSelect p={p} onChange={(s) => changeStatus(p, s)} />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copyParcel(p.parcel_id);
              }}
              className="block max-w-full truncate font-mono text-xs text-foreground"
            >
              {p.parcel_id}
            </button>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div><div className="text-[10px] uppercase text-muted-foreground">Acres</div><span className="font-mono">{p.acreage ?? "—"}</span></div>
              <div><div className="text-[10px] uppercase text-muted-foreground">Preço</div><Price p={p} /></div>
              <div><div className="text-[10px] uppercase text-muted-foreground">Margem</div><Margin p={p} /></div>
            </div>
            <div className="border-t border-border pt-1"><Actions p={p} onDD={() => setSelectedId(p.id)} /></div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <Button variant="outline" size="sm" className="h-8" disabled={filters.page <= 0} onClick={() => goPage(filters.page - 1)}>
          Anterior
        </Button>
        <span className="text-muted-foreground">
          Página <span className="font-mono text-foreground">{filters.page + 1}</span> de{" "}
          <span className="font-mono text-foreground">{totalPages}</span>
        </span>
        <Button variant="outline" size="sm" className="h-8" disabled={filters.page + 1 >= totalPages} onClick={() => goPage(filters.page + 1)}>
          Próxima
        </Button>
      </div>

      <RejectDialog
        property={rejecting}
        onCancel={() => setRejecting(null)}
        onConfirm={(reason) => {
          if (rejecting) update.mutate({ id: rejecting.id, patch: { status: "rejected", rejection_reason: reason } });
          setRejecting(null);
        }}
      />

      {/* Gaveta provisória de Due Diligence */}
      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected ? place(selected) : "Lote"}</SheetTitle>
            <SheetDescription className="font-mono">{selected?.parcel_id}</SheetDescription>
          </SheetHeader>
          <p className="mt-6 text-sm text-muted-foreground">Due Diligence em construção</p>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
