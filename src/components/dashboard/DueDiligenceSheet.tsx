import { useEffect, useState } from "react";
import { Check, CircleHelp, Copy, ExternalLink, Map as MapIcon, Megaphone, Satellite, ShoppingCart, Waves, X } from "lucide-react";
import { toast } from "sonner";
import { adInputFromProperty, checklistMismatch, generateAd, isPortalCounty, joinAd, splitAd } from "@/lib/ad-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUpdateProperty } from "@/hooks/use-properties";
import type { RejectionReason } from "@/lib/status";
import { cn } from "@/lib/utils";
import {
  EMPTY_CHECKLIST,
  type ChecklistValue,
  type DueDiligenceChecklist,
  type Property,
  type PropertyPatch,
  type PropertyStatus,
} from "@/types/property";
import { Margin, Price, StatusSelect, copyParcel, place } from "@/components/dashboard/PropertiesTable";

const ITEMS: { key: keyof DueDiligenceChecklist; label: string; reject: RejectionReason }[] = [
  { key: "road_access", label: "Acesso legal por estrada", reject: "no_legal_road_access" },
  { key: "flood_zone", label: "Fora de várzea / FEMA", reject: "wetland_fema" },
  { key: "zoning", label: "Zoneamento permite uso e revenda", reject: "other" },
  { key: "tax_status", label: "Impostos conferidos", reject: "other" },
];

const READY_OR_LATER: PropertyStatus[] = ["ready_to_buy", "purchased", "listed_for_sale", "sold"];

const next = (v: ChecklistValue): ChecklistValue => (v === null ? true : v === true ? false : null);

/** Funções de validação dos campos editáveis (retornam mensagem de erro ou null). */
export const validators = {
  latitude: (n: number | null) => (n !== null && (n < -90 || n > 90) ? "Latitude deve estar entre -90 e 90" : null),
  longitude: (n: number | null) => (n !== null && (n < -180 || n > 180) ? "Longitude deve estar entre -180 e 180" : null),
  target_sale_price: (n: number | null) => (n !== null && n <= 0 ? "Informe um valor positivo" : null),
  direct_buy_url: (s: string | null) => (s && !/^https?:\/\//i.test(s) ? "Deve começar com http:// ou https://" : null),
};

function Field({
  id,
  label,
  value,
  kind,
  validate,
  onSave,
  textarea,
  placeholder,
}: {
  id: string;
  label: string;
  value: string | number | null;
  kind: "number" | "text";
  validate?: (v: any) => string | null;
  onSave: (v: any, revert: () => void) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  const initial = value == null ? "" : String(value);
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setText(initial);
    setError(null);
  }, [initial]);

  function commit() {
    const raw = text.trim();
    if (raw === initial.trim()) return setError(null);
    let parsed: string | number | null = raw === "" ? null : raw;
    if (kind === "number" && parsed !== null) {
      const n = Number(String(parsed).replace(",", "."));
      if (!Number.isFinite(n)) return setError("Número inválido");
      parsed = n;
    }
    const err = validate?.(parsed) ?? null;
    setError(err);
    if (err) return;
    onSave(parsed, () => setText(initial));
  }

  const common = {
    id,
    value: text,
    placeholder,
    onBlur: commit,
    "aria-invalid": !!error,
    className: cn("text-xs", kind === "number" && "font-mono", error && "border-destructive"),
  };
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] text-muted-foreground">{label}</Label>
      {textarea ? (
        <Textarea {...common} rows={4} onChange={(e) => setText(e.target.value)} />
      ) : (
        <Input {...common} inputMode={kind === "number" ? "decimal" : undefined} className={cn(common.className, "h-8")} onChange={(e) => setText(e.target.value)} />
      )}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function Shortcut({ href, label, icon: Icon, hint }: { href: string | null; label: string; icon: typeof MapIcon; hint: string }) {
  if (!href)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button variant="outline" size="sm" className="h-8 w-full justify-start" disabled>
              <Icon className="h-4 w-4" /> {label}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{hint}</TooltipContent>
      </Tooltip>
    );
  return (
    <Button variant="outline" size="sm" className="h-8 w-full justify-start" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Icon className="h-4 w-4" /> {label} <ExternalLink className="ml-auto h-3 w-3 opacity-60" />
      </a>
    </Button>
  );
}

function AdSection({
  p,
  checklist,
  onStatus,
}: {
  p: Property;
  checklist: DueDiligenceChecklist;
  onStatus: (s: PropertyStatus) => void;
}) {
  const update = useUpdateProperty();
  const saved = p.marketing_copy_generated ?? "";
  const [title, setTitle] = useState(() => splitAd(saved).title);
  const [body, setBody] = useState(() => splitAd(saved).body);
  useEffect(() => {
    const s = splitAd(saved);
    setTitle(s.title);
    setBody(s.body);
  }, [p.id, saved]);

  const missingGps = p.latitude == null || p.longitude == null;
  const missingPrice = p.target_sale_price == null;
  const blocked = missingGps || missingPrice;

  function persist(t: string, b: string) {
    update.mutate({ id: p.id, patch: { marketing_copy_generated: joinAd(t, b) } });
  }

  function generate() {
    if (saved.trim() && !window.confirm("Isso vai substituir o texto atual. Continuar?")) return;
    const ad = generateAd(adInputFromProperty(p, checklist));
    setTitle(ad.title);
    setBody(ad.body);
    persist(ad.title, ad.body);
  }

  function useShortTitle() {
    const ad = generateAd(adInputFromProperty(p, checklist));
    setTitle(ad.shortTitle);
    persist(ad.shortTitle, body);
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success("Copiado", { duration: 1200 }));
  }

  const stale = checklistMismatch(joinAd(title, body), checklist);
  const titleLen = title.length;

  return (
    <section className="mt-4 space-y-2">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Anúncio de venda</div>

      <Button size="sm" className="h-8 w-full" disabled={blocked} onClick={generate}>
        <Megaphone className="h-4 w-4" /> Gerar Anúncio de Venda
      </Button>
      {missingGps && <p className="text-[11px] text-muted-foreground">Adicione as coordenadas GPS para gerar o anúncio</p>}
      {!missingGps && missingPrice && <p className="text-[11px] text-muted-foreground">Defina o preço alvo de venda</p>}
      {isPortalCounty(p.county_name) && (
        <p className="text-[11px] text-muted-foreground">
          Este lote não tem condado real cadastrado. Se quiser, adicione o condado editando o texto.
        </p>
      )}

      {(title || body) && (
        <>
          {stale && (
            <p className="rounded border border-border bg-muted/20 p-2 text-[11px] text-muted-foreground">
              O checklist mudou desde a geração. Gere de novo para atualizar o anúncio.
            </p>
          )}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="ad-title" className="text-[11px] text-muted-foreground">Título</Label>
              <span className="text-[10px] font-mono">
                <span className="text-muted-foreground">{titleLen}/150 Facebook</span>
                {" · "}
                <span className={titleLen > 70 ? "text-destructive" : "text-muted-foreground"}>{titleLen}/70 Craigslist</span>
              </span>
            </div>
            <Input
              id="ad-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => persist(title, body)}
              className="h-8 text-xs"
            />
            {titleLen > 70 && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={useShortTitle}>
                Usar título curto
              </Button>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="ad-body" className="text-[11px] text-muted-foreground">Corpo</Label>
            <Textarea
              id="ad-body"
              value={body}
              rows={10}
              onChange={(e) => setBody(e.target.value)}
              onBlur={() => persist(title, body)}
              className="text-xs"
            />
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={() => copyText(title)}>
              <Copy className="h-3 w-3" /> Copiar título
            </Button>
            <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={() => copyText(body)}>
              <Copy className="h-3 w-3" /> Copiar corpo
            </Button>
            <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={() => copyText(joinAd(title, body))}>
              <Copy className="h-3 w-3" /> Copiar tudo
            </Button>
          </div>
          {p.status === "purchased" && (
            <Button
              size="sm"
              className="h-8 w-full"
              onClick={() => {
                if (window.confirm("Marcar este lote como Anunciado (listed_for_sale)?")) onStatus("listed_for_sale");
              }}
            >
              Marcar como Anunciado
            </Button>
          )}
        </>
      )}
    </section>
  );
}

export function DueDiligenceSheet({
  property: p,
  open,
  onClose,
  onStatus,
  onReject,
}: {
  property: Property | null;
  open: boolean;
  onClose: () => void;
  onStatus: (s: PropertyStatus) => void;
  onReject: (preset: RejectionReason) => void;
}) {
  const update = useUpdateProperty();
  const checklist: DueDiligenceChecklist = { ...EMPTY_CHECKLIST, ...(p?.due_diligence_checklist ?? {}) };
  const approved = ITEMS.filter((i) => checklist[i.key] === true).length;
  const failed = ITEMS.find((i) => checklist[i.key] === false);

  function save(patch: PropertyPatch, revert?: () => void, okMsg?: string) {
    if (!p) return;
    update.mutate(
      { id: p.id, patch },
      {
        onSuccess: () => okMsg && toast.success(okMsg, { duration: 1500 }),
        onError: () => revert?.(),
      },
    );
  }

  function cycle(key: keyof DueDiligenceChecklist) {
    save({ due_diligence_checklist: { ...checklist, [key]: next(checklist[key]) } });
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-4 sm:max-w-md">
        {p && (
          <TooltipProvider delayDuration={200}>
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-base">{place(p)}</SheetTitle>
              <SheetDescription asChild>
                <button type="button" onClick={() => copyParcel(p.parcel_id)} className="text-left font-mono text-xs hover:text-primary" title="Copiar Parcel ID">
                  {p.parcel_id}
                </button>
              </SheetDescription>
            </SheetHeader>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-md border border-border p-2 text-xs">
              <div><div className="text-[10px] uppercase text-muted-foreground">Acres</div><span className="font-mono">{p.acreage ?? "—"}</span></div>
              <div><div className="text-[10px] uppercase text-muted-foreground">Preço OTC</div><Price p={p} /></div>
              <div><div className="text-[10px] uppercase text-muted-foreground">Margem est.</div><Margin p={p} /></div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Status</span>
              <StatusSelect p={p} onChange={onStatus} />
            </div>

            {/* Sugestões (o usuário sempre confirma) */}
            {approved === 4 && !READY_OR_LATER.includes(p.status) && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-primary/40 bg-primary/10 p-2 text-xs">
                <span>Todos os itens aprovados.</span>
                <Button size="sm" className="h-7" onClick={() => onStatus("ready_to_buy")}>Mover para Pronto p/ comprar</Button>
              </div>
            )}
            {failed && p.status !== "rejected" && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs">
                <span>Há item reprovado.</span>
                <Button size="sm" variant="destructive" className="h-7" onClick={() => onReject(failed.reject)}>Rejeitar este lote</Button>
              </div>
            )}

            <section className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>Checklist</span>
                <span className="font-mono normal-case text-foreground">{approved}/4 aprovados</span>
              </div>
              <Progress value={(approved / 4) * 100} className="h-1.5" />
              <div className="space-y-1">
                {ITEMS.map((i) => {
                  const v = checklist[i.key];
                  const Icon = v === true ? Check : v === false ? X : CircleHelp;
                  return (
                    <button
                      key={i.key}
                      type="button"
                      onClick={() => cycle(i.key)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left text-xs transition-colors",
                        v === true && "border-primary/50 bg-primary/10 text-primary",
                        v === false && "border-destructive/50 bg-destructive/10 text-destructive",
                        v === null && "border-border text-muted-foreground hover:bg-muted/30",
                      )}
                      aria-label={`${i.label}: ${v === true ? "OK" : v === false ? "reprovado" : "não verificado"}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{i.label}</span>
                      <span className="text-[10px] uppercase">{v === true ? "OK" : v === false ? "Reprovado" : "Não verificado"}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-4 space-y-1.5">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Atalhos</div>
              <Shortcut href="https://msc.fema.gov/portal/home" label="Mapa FEMA de inundação" icon={Waves} hint="" />
              <Shortcut href={p.gis_url} label="Abrir GIS do condado" icon={MapIcon} hint="GIS não configurado para este condado" />
              <Shortcut href={p.satellite_url} label="Satélite / GPS" icon={Satellite} hint="Sem coordenadas" />
              <Shortcut href={p.direct_buy_url ?? p.portal_buy_url} label="Portal oficial de compra" icon={ShoppingCart} hint="Sem link de compra" />
            </section>

            <section className="mt-4 space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Dados</div>
              <div className="grid grid-cols-2 gap-2">
                <Field id="dd-lat" label="Latitude" kind="number" value={p.latitude} validate={validators.latitude}
                  onSave={(v, r) => save({ latitude: v }, r, "Latitude salva")} />
                <Field id="dd-lng" label="Longitude" kind="number" value={p.longitude} validate={validators.longitude}
                  onSave={(v, r) => save({ longitude: v }, r, "Longitude salva")} />
              </div>
              <Field id="dd-target" label="Preço alvo de venda ($)" kind="number" value={p.target_sale_price} validate={validators.target_sale_price}
                onSave={(v, r) => save({ target_sale_price: v }, r, "Preço alvo salvo")} />
              <Field id="dd-url" label="Link direto de compra" kind="text" placeholder="https://" value={p.direct_buy_url} validate={validators.direct_buy_url}
                onSave={(v, r) => save({ direct_buy_url: v }, r, "Link salvo")} />
              <Field id="dd-notes" label="Notas" kind="text" textarea value={p.notes}
                onSave={(v, r) => save({ notes: v }, r, "Notas salvas")} />
            </section>
          </TooltipProvider>
        )}
      </SheetContent>
    </Sheet>
  );
}
