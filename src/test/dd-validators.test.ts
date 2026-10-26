import { describe, expect, it } from "vitest";
import { validators } from "@/components/dashboard/DueDiligenceSheet";
import { withDerived } from "@/hooks/use-properties";

describe("campos da Due Diligence", () => {
  it("latitude entre -90 e 90", () => {
    expect(validators.latitude(90)).toBeNull();
    expect(validators.latitude(90.1)).not.toBeNull();
  });
  it("longitude entre -180 e 180", () => {
    expect(validators.longitude(-180)).toBeNull();
    expect(validators.longitude(-181)).not.toBeNull();
  });
  it("preço alvo precisa ser positivo", () => {
    expect(validators.target_sale_price(0)).not.toBeNull();
    expect(validators.target_sale_price(1500)).toBeNull();
  });
  it("link precisa começar com http:// ou https://", () => {
    expect(validators.direct_buy_url("www.x.com")).not.toBeNull();
    expect(validators.direct_buy_url("https://x.com")).toBeNull();
  });
  it("coordenadas salvas habilitam o satélite na hora", () => {
    const p = withDerived({ latitude: 30, longitude: -85, otc_price: 500, target_sale_price: null } as any);
    expect(p.satellite_url).toContain("30,-85");
  });
});
