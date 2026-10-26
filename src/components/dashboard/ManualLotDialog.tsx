import { useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCounties, useCreateProperty } from "@/hooks/use-properties";
import { STATE_NAMES } from "@/lib/status";
import type { NewProperty, UsState } from "@/types/property";

const EMPTY = {
  state: "",
  county_state_id: "",
  parcel_id: "",
  acreage: "",
  otc_price: "",
  target_sale_price: "1990",
  latitude: "",
  longitude: "",
  direct_buy_url: "",
  notes: "",
};
type Form = typeof EMPTY;

const selectCls =
  "h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50";

export function validateManualLot(f: Form): { errors: Partial<Record<keyof Form, string>>; value?: NewProperty } {
  const errors: Partial<Record<keyof Form, string>> = {};
  const n = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
  if (!f.county_state_id) errors.county_state_id = "Escolha o condado.";
  if (!f.parcel_id.trim()) errors.parcel_id = "Parcel ID é obrigatório.";
  const positive = (k: "acreage" | "otc_price" | "target_sale_price") => {
    const v = n(f[k]);
    if (v !== null && (!Number.isFinite(v) || v <= 0)) errors[k] = "Use um número positivo.";
    return v;
  };
  const acreage = positive("acreage");
  const otc_price = positive("otc_price");
  const target_sale_price = positive("target_sale_price");
  const latitude = n(f.latitude);
  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90))
    errors.latitude = "Latitude entre -90 e 90.";
  const longitude = n(f.longitude);
  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
    errors.longitude = "Longitude entre -180 e 180.";
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    value: {
      county_state_id: f.county_state_id,
      parcel_id: f.parcel_id.trim(),
      acreage,
      otc_price,
      target_sale_price: target_sale_price ?? 1990,
      latitude,
      longitude,
      direct_buy_url: f.direct_buy_url.trim() || null,
      notes: f.notes.trim() || null,
    },
  };
}

export function ManualLotDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const { data: counties = [] } = useCounties();
  const create = useCreateProperty();

  const states = useMemo(
    () => Array.from(new Set(counties.map((c) => c.state))) as UsState[],
    [counties],
  );
  const countyOptions = counties.filter((c) => c.state === form.state);
  const set = (k: keyof Form) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const { errors: errs, value } = validateManualLot(form);
    setErrors(errs);
    if (!value) return;
    create.mutate(value, {
      onSuccess: () => {
        toast.success("Lote criado.");
        setOpen(false);
        setForm(EMPTY);
        setErrors({});
      },
    });
  }

  const field = (k: keyof Form, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1">
      <Label htmlFor={`f-${k}`} className="text-xs text-muted-foreground">{label}</Label>
      <Input id={`f-${k}`} className="h-8" value={form[k]} onChange={(e) => set(k)(e.target.value)} {...props} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus className="h-4 w-4" /> Lote manual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo lote manual</DialogTitle>
          <DialogDescription>Cadastre um terreno OTC encontrado fora da coleta automática.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="f-state" className="text-xs text-muted-foreground">Estado</Label>
              <select
                id="f-state"
                className={selectCls}
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value, county_state_id: "" }))}
              >
                <option value="">Selecione</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s} — {STATE_NAMES[s]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-county" className="text-xs text-muted-foreground">Condado</Label>
              <select
                id="f-county"
                className={selectCls}
                disabled={!form.state}
                value={form.county_state_id}
                onChange={(e) => set("county_state_id")(e.target.value)}
              >
                <option value="">Selecione</option>
                {countyOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.county_name}</option>
                ))}
              </select>
              {errors.county_state_id && <p className="text-xs text-destructive">{errors.county_state_id}</p>}
            </div>
          </div>
          {field("parcel_id", "Parcel ID *", { className: "h-8 font-mono" })}
          <div className="grid grid-cols-3 gap-3">
            {field("acreage", "Acres", { inputMode: "decimal" })}
            {field("otc_price", "Preço OTC ($)", { inputMode: "decimal" })}
            {field("target_sale_price", "Preço alvo ($)", { inputMode: "decimal" })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("latitude", "Latitude", { inputMode: "decimal" })}
            {field("longitude", "Longitude", { inputMode: "decimal" })}
          </div>
          {field("direct_buy_url", "Link de compra", { type: "url", placeholder: "https://" })}
          <div className="space-y-1">
            <Label htmlFor="f-notes" className="text-xs text-muted-foreground">Notas</Label>
            <Textarea id="f-notes" rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
