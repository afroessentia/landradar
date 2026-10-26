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
