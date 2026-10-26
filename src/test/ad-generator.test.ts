import { describe, expect, it } from "vitest";
import {
  ASSERTION_LINES,
  adInputFromProperty,
  checklistMismatch,
  generateAd,
  splitAd,
  joinAd,
} from "@/lib/ad-generator";
import type { Property } from "@/types/property";
import { EMPTY_CHECKLIST } from "@/types/property";

const base = {
  acreage: 0.5,
  target_sale_price: 1990,
  latitude: 30.123456789,
  longitude: -85.987654321,
  parcel_id: "12-34-56",
  county_name: "Lee",
  state: "FL",
  checklist: { ...EMPTY_CHECKLIST },
};

describe("generateAd", () => {
  it("item null ou false não gera nenhuma linha de afirmação", () => {
    const adNull = generateAd({ ...base, checklist: { ...EMPTY_CHECKLIST } });
    const adFalse = generateAd({
      ...base,
      checklist: { road_access: false, flood_zone: false, zoning: false, tax_status: false },
    });
    for (const ad of [adNull, adFalse]) {
      for (const line of Object.values(ASSERTION_LINES)) {
        expect(ad.body).not.toContain(line);
      }
    }
  });

  it("os três itens true geram as três linhas", () => {
    const ad = generateAd({
      ...base,
      checklist: { road_access: true, flood_zone: true, zoning: null, tax_status: true },
    });
    expect(ad.body).toContain(ASSERTION_LINES.road_access);
    expect(ad.body).toContain(ASSERTION_LINES.flood_zone);
    expect(ad.body).toContain(ASSERTION_LINES.tax_status);
  });

  it("acres igual a 1 usa singular", () => {
    const ad = generateAd({ ...base, acreage: 1 });
    expect(ad.title).toMatch(/^1 Acre in/);
    expect(ad.body).toContain("1 acre vacant lot");
    expect(ad.body).toContain("- Size: 1 acre");
    expect(ad.body).not.toContain("acres");
  });

  it("condado de portal é omitido do texto", () => {
    for (const portal of ["COSL Central", "SOS Public Lands", "ALDOR Land Tax"]) {
      const ad = generateAd({ ...base, county_name: portal });
      expect(ad.title).toBe("0.5 Acres in Florida | $1,990 Cash | GPS Coordinates Included");
      expect(ad.shortTitle).toBe("0.5 Acres, Florida | $1,990 Cash");
      expect(ad.body).toContain("vacant lot in Florida.");
      expect(ad.body).not.toContain(portal);
      expect(ad.body).not.toContain("County");
    }
  });

  it("título longo passa de 70 caracteres e o curto não", () => {
    const ad = generateAd(base);
    expect(ad.title.length).toBeGreaterThan(70);
    expect(ad.shortTitle.length).toBeLessThanOrEqual(70);
  });

  it("formatação: preço americano, acres sem zeros, GPS com 6 casas", () => {
    const ad = generateAd({ ...base, acreage: "1.250", target_sale_price: "1990" });
    expect(ad.title).toContain("1.25 Acres in Lee County, Florida | $1,990 Cash");
    expect(ad.body).toContain("GPS: 30.123457, -85.987654");
  });

  it("nunca afirma zoneamento", () => {
    const ad = generateAd({
      ...base,
      checklist: { road_access: true, flood_zone: true, zoning: true, tax_status: true },
    });
    expect(ad.body).not.toMatch(/buildable|zoned residential/i);
  });
});

describe("joinAd / splitAd", () => {
  it("separa título (primeira linha) e corpo (após a primeira linha em branco)", () => {
    const text = joinAd("Meu título", "Linha 1\n\nLinha 2");
    expect(splitAd(text)).toEqual({ title: "Meu título", body: "Linha 1\n\nLinha 2" });
  });
});

describe("checklistMismatch", () => {
  it("detecta divergência entre texto salvo e checklist atual", () => {
    const ad = generateAd({ ...base, checklist: { ...EMPTY_CHECKLIST, road_access: true } });
    const text = joinAd(ad.title, ad.body);
    // checklist atual igual ao da geração: sem divergência
    expect(checklistMismatch(text, { ...EMPTY_CHECKLIST, road_access: true })).toBe(false);
    // item desmarcado depois: divergência
    expect(checklistMismatch(text, { ...EMPTY_CHECKLIST })).toBe(true);
    // item marcado depois: divergência
    expect(checklistMismatch(text, { ...EMPTY_CHECKLIST, road_access: true, flood_zone: true })).toBe(true);
  });
});

describe("adInputFromProperty", () => {
  it("mapeia os campos da view para o gerador", () => {
    const p = {
      acreage: 2,
      target_sale_price: 2990,
      latitude: 34,
      longitude: -90,
      parcel_id: "P-1",
      county_name: "Lee",
      state: "MS",
    } as Property;
    expect(adInputFromProperty(p, EMPTY_CHECKLIST)).toEqual({
      acreage: 2,
      target_sale_price: 2990,
      latitude: 34,
      longitude: -90,
      parcel_id: "P-1",
      county_name: "Lee",
      state: "MS",
      checklist: EMPTY_CHECKLIST,
    });
  });
});
