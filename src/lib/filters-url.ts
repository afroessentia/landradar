import {
  ALL_STATUSES,
  DEFAULT_FILTERS,
  type PropertyFilters,
  type PropertySortBy,
  type PropertyStatus,
  type UsState,
} from "@/types/property";

export const SORTABLE: PropertySortBy[] = ["est_margin", "otc_price", "acreage", "created_at"];
export const ALL_STATES: UsState[] = ["AR", "MS", "AL", "FL", "NM", "AZ"];

/** Parâmetros da URL (todos opcionais, apenas o que difere do padrão). */
export interface FilterSearch {
  status?: string | undefined;
  maxPrice?: number | undefined;
  minAcreage?: number | undefined;
  states?: string | undefined;
  gps?: number | undefined;
  fav?: number | undefined;
  q?: string | undefined;
  page?: number | undefined;
  sortBy?: string | undefined;
  sortDir?: string | undefined;
}

const list = (v: unknown) =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const numOr = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** Normaliza o objeto bruto da URL. */
export function validateFilterSearch(raw: Record<string, unknown>): FilterSearch {
  const out: FilterSearch = {};
  const st = list(raw["status"]).filter((s) => ALL_STATUSES.includes(s as PropertyStatus));
  if (st.length) out.status = st.join(",");
  const mp = numOr(raw["maxPrice"]);
  if (mp !== undefined && mp > 0) out.maxPrice = mp;
  const ma = numOr(raw["minAcreage"]);
  if (ma !== undefined && ma >= 0) out.minAcreage = ma;
  const states = list(raw["states"]).filter((s) => ALL_STATES.includes(s as UsState));
  if (states.length) out.states = states.join(",");
  if (String(raw["gps"]) === "1") out.gps = 1;
  if (String(raw["fav"]) === "1") out.fav = 1;
  const q = raw["q"] == null ? "" : String(raw["q"]);
  if (q.trim()) out.q = q;
  const page = numOr(raw["page"]);
  if (page !== undefined && page > 1) out.page = Math.floor(page);
  const sb = String(raw["sortBy"] ?? "");
  if (SORTABLE.includes(sb as PropertySortBy)) out.sortBy = sb;
  const sd = String(raw["sortDir"] ?? "");
  if (sd === "asc" || sd === "desc") out.sortDir = sd;
  return out;
}

/** URL -> filtros completos (padrão quando o parâmetro não existe). */
export function searchToFilters(s: FilterSearch): PropertyFilters {
  const statuses = list(s.status) as PropertyStatus[];
  const states = list(s.states) as UsState[];
  return {
    ...DEFAULT_FILTERS,
    statuses: statuses.length ? statuses : DEFAULT_FILTERS.statuses,
    states,
    maxPrice: s.maxPrice ?? DEFAULT_FILTERS.maxPrice,
    minAcreage: s.minAcreage ?? DEFAULT_FILTERS.minAcreage,
    onlyWithGps: s.gps === 1,
    onlyFavorites: s.fav === 1,
    search: s.q ?? "",
    page: s.page && s.page > 1 ? s.page - 1 : 0,
    sortBy: (s.sortBy as PropertySortBy) ?? DEFAULT_FILTERS.sortBy,
    sortDir: s.sortDir === "asc" || s.sortDir === "desc" ? s.sortDir : DEFAULT_FILTERS.sortDir,
  };
}

const sameSet = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Filtros -> URL, gravando somente o que difere do padrão. */
export function filtersToSearch(f: PropertyFilters): FilterSearch {
  const out: FilterSearch = {};
  if (!sameSet(f.statuses, DEFAULT_FILTERS.statuses) && f.statuses.length) out.status = f.statuses.join(",");
  if (f.maxPrice !== DEFAULT_FILTERS.maxPrice) out.maxPrice = f.maxPrice;
  if (f.minAcreage !== DEFAULT_FILTERS.minAcreage) out.minAcreage = f.minAcreage;
  if (f.states.length) out.states = f.states.join(",");
  if (f.onlyWithGps) out.gps = 1;
  if (f.onlyFavorites) out.fav = 1;
  if (f.search.trim()) out.q = f.search;
  if (f.page > 0) out.page = f.page + 1;
  if (f.sortBy !== DEFAULT_FILTERS.sortBy || f.sortDir !== DEFAULT_FILTERS.sortDir) {
    out.sortBy = f.sortBy;
    out.sortDir = f.sortDir;
  }
  return out;
}

/** Quantos filtros (sem página e ordenação) diferem do padrão. */
export function countActiveFilters(f: PropertyFilters): number {
  const { page: _p, sortBy: _b, sortDir: _d, ...rest } = filtersToSearch(f);
  return Object.keys(rest).length;
}

/** Aplica uma mudança de filtro e volta para a página 1. */
export function changeFilters(current: PropertyFilters, patch: Partial<PropertyFilters>): FilterSearch {
  return filtersToSearch({ ...current, ...patch, page: 0 });
}
