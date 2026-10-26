import { isPriceFiltered } from "@/lib/filters-url";
import { useEffect } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toastDbError } from "@/lib/db-errors";
import type {
  County,
  NewProperty,
  Property,
  PropertyFilters,
  PropertyPatch,
} from "@/types/property";

// O cliente é usado sem tipagem de select para evitar parsing pesado de tipos.
const db = supabase as any;

export const propertyKeys = {
  all: ["properties"] as const,
  list: (f: PropertyFilters) => ["properties", "list", f] as const,
  metrics: ["properties", "metrics"] as const,
  counties: ["counties"] as const,
};

/** Aplica os filtros (exceto preço) a um builder de v_properties. */
function applyBaseFilters(q: any, f: PropertyFilters) {
  if (f.states.length) q = q.in("state", f.states);
  if (f.counties.length) q = q.in("county_state_id", f.counties);
  if (f.statuses.length) q = q.in("status", f.statuses);
  if (f.onlyFavorites) q = q.eq("favorite", true);
  if (f.onlyWithGps) q = q.not("latitude", "is", null).not("longitude", "is", null);
  if (f.minAcreage > 0) q = q.gte("acreage", f.minAcreage);
  const s = f.search.trim().replace(/[,()*%]/g, " ").trim();
  if (s) q = q.or(`parcel_id.ilike.%${s}%,county_name.ilike.%${s}%`);
  return q;
}

export interface PropertiesResult {
  rows: Property[];
  total: number;
  /** lotes sem preço (otc_price nulo) que ficaram de fora pelo filtro de preço máximo */
  excludedWithoutPrice: number;
}

async function fetchProperties(f: PropertyFilters): Promise<PropertiesResult> {
  const from = f.page * f.pageSize;
  const to = from + f.pageSize - 1;

  let q = applyBaseFilters(db.from("v_properties").select("*", { count: "exact" }), f);
  const priced = isPriceFiltered(f);
  if (priced) q = q.gte("otc_price", f.minPrice).lte("otc_price", f.maxPrice);
  q = q
    .order(f.sortBy, { ascending: f.sortDir === "asc", nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  const noPrice = applyBaseFilters(
    db.from("v_properties").select("id", { count: "exact", head: true }),
    f,
  ).is("otc_price", null);

  const [main, missing] = await Promise.all([q, priced ? noPrice : Promise.resolve({ count: 0, error: null })]);
  if (main.error) throw main.error;
  if (missing.error) throw missing.error;

  return {
    rows: (main.data ?? []) as Property[],
    total: main.count ?? 0,
    excludedWithoutPrice: missing.count ?? 0,
  };
}

function useErrorToast(error: unknown, context: string) {
  useEffect(() => {
    if (error) toastDbError(error, context);
  }, [error, context]);
}

export function useProperties(filters: PropertyFilters) {
  const query = useQuery({
    queryKey: propertyKeys.list(filters),
    queryFn: () => fetchProperties(filters),
    placeholderData: keepPreviousData,
  });
  useErrorToast(query.error, "Erro ao carregar lotes");
  return query;
}

export function useCounties() {
  const query = useQuery({
    queryKey: propertyKeys.counties,
    queryFn: async (): Promise<County[]> => {
      const { data, error } = await db
        .from("counties_states")
        .select("*")
        .order("state", { ascending: true })
        .order("county_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as County[];
    },
    staleTime: 5 * 60_000,
  });
  useErrorToast(query.error, "Erro ao carregar condados");
  return query;
}

export interface Metrics {
  cheapNew: number;
  dueDiligence: number;
  purchased: number;
  listed: number;
}

export function useMetrics() {
  const query = useQuery({
    queryKey: propertyKeys.metrics,
    queryFn: async (): Promise<Metrics> => {
      const head = () =>
        db.from("otc_properties").select("id", { count: "exact", head: true });
      const res = await Promise.all([
        head().lt("otc_price", 600).eq("status", "new_detected"),
        head().eq("status", "due_diligence"),
        head().eq("status", "purchased"),
        head().eq("status", "listed_for_sale"),
      ]);
      const err = res.find((r: any) => r.error)?.error;
      if (err) throw err;
      return {
        cheapNew: res[0].count ?? 0,
        dueDiligence: res[1].count ?? 0,
        purchased: res[2].count ?? 0,
        listed: res[3].count ?? 0,
      };
    },
  });
  useErrorToast(query.error, "Erro ao carregar métricas");
  return query;
}

/** Recalcula os campos derivados da view (satellite_url, est_margin) no cache otimista. */
export function withDerived(p: Property): Property {
  return {
    ...p,
    satellite_url:
      p.latitude != null && p.longitude != null
        ? `https://www.google.com/maps/@${p.latitude},${p.longitude},18z/data=!3m1!1e3`
        : null,
    est_margin: (p.target_sale_price ?? 0) - (p.otc_price ?? 0),
  };
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: PropertyPatch }) => {
      const { error } = await db.from("otc_properties").update(patch).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: propertyKeys.all });
      const snapshots = qc.getQueriesData<PropertiesResult>({
        queryKey: ["properties", "list"],
      });
      qc.setQueriesData<PropertiesResult>({ queryKey: ["properties", "list"] }, (old) =>
        old
          ? { ...old, rows: old.rows.map((r) => (r.id === id ? withDerived({ ...r, ...patch }) : r)) }
          : old,
      );
      return { snapshots };
    },
    onError: (err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]: [QueryKey, unknown]) => qc.setQueryData(key, data));
      toastDbError(err, "Erro ao salvar");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: propertyKeys.all }),
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewProperty) => {
      const { data, error } = await db.from("otc_properties").insert(input).select("id").single();
      if (error) throw error;
      return data as { id: string };
    },
    onError: (err) => toastDbError(err, "Erro ao criar lote"),
    onSettled: () => qc.invalidateQueries({ queryKey: propertyKeys.all }),
  });
}
