import { describe, expect, it } from "vitest";
import { translateDbError } from "@/lib/db-errors";

describe("translateDbError", () => {
  it("duplicidade 23505", () => {
    expect(translateDbError({ code: "23505", message: "dup" })).toBe(
      "Esse Parcel ID já existe neste condado.",
    );
  });
  it("rejeitado sem motivo (chk_rejection)", () => {
    expect(
      translateDbError({ code: "23514", message: 'violates check constraint "chk_rejection"' }),
    ).toBe("Informe o motivo da rejeição antes de salvar.");
  });
});
