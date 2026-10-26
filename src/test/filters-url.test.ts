import { describe, expect, it } from "vitest";
import { changeFilters, filtersToSearch, searchToFilters, validateFilterSearch } from "@/lib/filters-url";

describe("filtros na URL", () => {
  it("sem parâmetros usa o padrão (preço 800, sem rejeitado/vendido)", () => {
    const f = searchToFilters(validateFilterSearch({}));
    expect(f.maxPrice).toBe(800);
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
