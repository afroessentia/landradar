import type { DueDiligenceChecklist, Property } from "@/types/property";

/** Nomes de portal que não são condados reais: omitidos do texto do anúncio. */
export const PORTAL_COUNTIES = ["COSL Central", "SOS Public Lands", "ALDOR Land Tax"];

export const STATE_NAMES: Record<string, string> = {
  AR: "Arkansas",
  MS: "Mississippi",
  AL: "Alabama",
  FL: "Florida",
  NM: "New Mexico",
  AZ: "Arizona",
};

/** Linhas de afirmação: incluídas em DETAILS somente quando o item do checklist é true. */
export const ASSERTION_LINES = {
  road_access: "- Legal road access verified",
  flood_zone: "- Outside FEMA flood zone (verified on FEMA Flood Map Service Center)",
  tax_status: "- Property taxes checked at time of purchase",
} as const;

export interface AdInput {
  acreage: number | string | null;
  target_sale_price: number | string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  parcel_id: string;
  county_name: string | null;
  state: string | null;
  checklist: DueDiligenceChecklist;
}

export interface AdOutput {
  title: string;
  shortTitle: string;
  body: string;
}

export const isPortalCounty = (county: string | null | undefined): boolean =>
  !!county && PORTAL_COUNTIES.includes(county);

function formatAcres(a: number | string): string {
  return String(Math.round(Number(a) * 100) / 100);
}

function formatPrice(p: number | string): string {
  return Number(p).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatCoord(c: number | string): string {
  return Number(c).toFixed(6);
}

/** Geração pura do anúncio de venda — sem IA nem serviço externo. */
export function generateAd(input: AdInput): AdOutput {
  const acres = formatAcres(input.acreage ?? 0);
  const singular = Number(input.acreage) === 1;
  const acresWord = singular ? "Acre" : "Acres";
  const acresWordLower = singular ? "acre" : "acres";
  const price = formatPrice(input.target_sale_price ?? 0);
  const stateName = STATE_NAMES[input.state ?? ""] ?? input.state ?? "";
  const location = isPortalCounty(input.county_name)
    ? stateName
    : `${input.county_name} County, ${stateName}`;
  const shortLocation = isPortalCounty(input.county_name)
    ? stateName
    : `${input.county_name} County ${input.state}`;

  const assertions = (Object.keys(ASSERTION_LINES) as (keyof typeof ASSERTION_LINES)[])
    .filter((k) => input.checklist[k] === true)
    .map((k) => ASSERTION_LINES[k]);

  const title = `${acres} ${acresWord} in ${location} | $${price} Cash | GPS Coordinates Included`;
  const shortTitle = `${acres} ${acresWord}, ${shortLocation} | $${price} Cash`;

  const body = `${acres} ${acresWordLower} vacant lot in ${location}.

PRICE: $${price} cash. No financing.

LOCATION
Parcel ID: ${input.parcel_id}
GPS: ${formatCoord(input.latitude ?? 0)}, ${formatCoord(input.longitude ?? 0)}
Feel free to visit the property anytime using these GPS coordinates. No appointment needed. Please respect neighboring properties.

DETAILS
- Size: ${acres} ${acresWordLower}
- Sold As-Is via Deed Transfer${assertions.length ? "\n" + assertions.join("\n") : ""}
- Buyer is responsible for verifying zoning, access and permitted use with the county before purchase

CLOSING
Fast online closing with digital e-notary and e-recording. Message me to get started.`;

  return { title, shortTitle, body };
}

/** Serializa título + corpo para marketing_copy_generated (título, linha em branco, corpo). */
export function joinAd(title: string, body: string): string {
  return `${title.trim()}\n\n${body.trim()}`;
}

/** Separa o texto salvo em título (primeira linha) e corpo (após a primeira linha em branco). */
export function splitAd(text: string): { title: string; body: string } {
  const lines = text.split("\n");
  const title = (lines[0] ?? "").trim();
  const blank = lines.findIndex((l, i) => i > 0 && l.trim() === "");
  const body = (blank === -1 ? [] : lines.slice(blank + 1)).join("\n").trim();
  return { title, body };
}

/**
 * Detecta divergência entre o texto salvo e o checklist atual, sem guardar cópia:
 * cada linha de afirmação deve estar presente exatamente quando o item é true.
 */
export function checklistMismatch(savedText: string, checklist: DueDiligenceChecklist): boolean {
  if (!savedText.trim()) return false;
  return (Object.keys(ASSERTION_LINES) as (keyof typeof ASSERTION_LINES)[]).some(
    (k) => savedText.includes(ASSERTION_LINES[k]) !== (checklist[k] === true),
  );
}

export function adInputFromProperty(p: Property, checklist: DueDiligenceChecklist): AdInput {
  return {
    acreage: p.acreage,
    target_sale_price: p.target_sale_price,
    latitude: p.latitude,
    longitude: p.longitude,
    parcel_id: p.parcel_id,
    county_name: p.county_name,
    state: p.state,
    checklist,
  };
}
