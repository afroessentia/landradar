import { describe, expect, it } from "vitest";
import { changeFilters, filtersToSearch, searchToFilters, validateFilterSearch } from "@/lib/filters-url";

describe("filtros na URL", () => {
  it("sem parâmetros usa o padrão (preço 0 a 3000, sem rejeitado/vendido)", () => {
    const f = searchToFilters(validateFilterSearch({}));
    expect(f.minPrice).toBe(0);
    expect(f.maxPrice).toBe(3000);
    expect(f.statuses).not.toContain("rejected");
    expect(f.statuses).not.toContain("sold");
    expect(filtersToSearch(f)).toEqual({});
  });
  it("lê vários status separados por vírgula", () => {
    const f = searchToFilters(validateFilterSearch({ status: "new_detected,ready_to_buy" }));
    expect(f.statuses).toEqual(["new_detected", "ready_to_buy"]);
  });
  it("mudar um filtro volta para a página 1", () => {
    const f = searchToFilters(validateFilterSearch({ page: 3 }));
    expect(f.page).toBe(2);
    expect(changeFilters(f, { onlyFavorites: true })).toEqual({ fav: 1 });
  });
});

import { countActiveFilters as _caf, filtersToSearch as _fts, searchToFilters as _stf } from "@/lib/filters-url";
import { DEFAULT_FILTERS as _DF } from "@/types/property";
describe("ordenação na URL", () => {
  it("não grava a ordenação padrão (margem desc)", () => {
    expect(_fts(_DF)).toEqual({});
  });
  it("grava sortBy e sortDir quando diferem do padrão", () => {
    expect(_fts({ ..._DF, sortBy: "acreage", sortDir: "asc" })).toEqual({ sortBy: "acreage", sortDir: "asc" });
    expect(_stf({ sortBy: "acreage", sortDir: "asc" }).sortBy).toBe("acreage");
  });
  it("ordenação e página não contam como filtro ativo", () => {
    expect(_caf({ ..._DF, sortBy: "acreage", page: 3 })).toBe(0);
    expect(_caf({ ..._DF, onlyFavorites: true })).toBe(1);
  });
});

import { activePricePreset, isPriceFiltered, pruneCounties } from "@/lib/filters-url";
const C1 = "11111111-1111-1111-1111-111111111111";
const C2 = "22222222-2222-2222-2222-222222222222";
describe("faixa de preço e condados", () => {
  it("minPrice 0 e maxPrice 3000 não vão para a URL", () => {
    expect(_fts({ ..._DF, minPrice: 0, maxPrice: 3000 })).toEqual({});
    expect(_fts({ ..._DF, minPrice: 1000, maxPrice: 2000 })).toEqual({ minPrice: 1000, maxPrice: 2000 });
  });
  it("atalhos de faixa ficam ativos só com valores exatos", () => {
    expect(activePricePreset({ minPrice: 0, maxPrice: 3000 })).toBe("all");
    expect(activePricePreset({ minPrice: 0, maxPrice: 600 })).toBe("upto600");
    expect(activePricePreset({ minPrice: 1000, maxPrice: 2000 })).toBe("1k2k");
    expect(activePricePreset({ minPrice: 50, maxPrice: 600 })).toBeNull();
  });
  it("atalho muda só o preço e mantém outros filtros", () => {
    const f = { ..._DF, onlyFavorites: true };
    expect(changeFilters(f, { minPrice: 0, maxPrice: 600 })).toEqual({ fav: 1, maxPrice: 600 });
  });
  it("counties vai para a URL só com seleção e conta como filtro", () => {
    expect(_fts({ ..._DF, counties: [C1, C2] })).toEqual({ counties: `${C1},${C2}` });
    expect(_stf(validateFilterSearch({ counties: `${C1},${C2}` })).counties).toEqual([C1, C2]);
    expect(_caf({ ..._DF, counties: [C1] })).toBe(1);
  });
  it("desmarcar estado remove os condados dele", () => {
    const list = [{ id: C1, state: "AR" as const }, { id: C2, state: "FL" as const }];
    expect(pruneCounties([C1, C2], ["FL"], list)).toEqual([C2]);
    expect(pruneCounties([C1, C2], [], list)).toEqual([C1, C2]);
  });
  it("faixa completa não filtra preço (lotes sem preço aparecem)", () => {
    expect(isPriceFiltered(_DF)).toBe(false);
    expect(isPriceFiltered({ minPrice: 0, maxPrice: 600 })).toBe(true);
    expect(isPriceFiltered({ minPrice: 50, maxPrice: 3000 })).toBe(true);
  });
});
