import type { PropertyStatus, UsState } from "@/types/property";

export interface StatusMeta {
  label: string;
  /** cor de referência (sem laranja/amarelo) */
  color: string;
  /** classes Tailwind do badge, via tokens --color-status-* */
  badgeClass: string;
}

export const STATUS_META: Record<PropertyStatus, StatusMeta> = {
  new_detected: {
    label: "Novo",
    color: "#3B82F6",
    badgeClass: "bg-status-new/15 text-status-new border-status-new/40",
  },
  due_diligence: {
    label: "Due Diligence",
    color: "#A855F7",
    badgeClass: "bg-status-dd/15 text-status-dd border-status-dd/40",
  },
  ready_to_buy: {
    label: "Pronto p/ comprar",
    color: "#00D285",
    badgeClass: "bg-status-ready/15 text-status-ready border-status-ready/40",
  },
  purchased: {
    label: "Comprado",
    color: "#00875A",
    badgeClass: "bg-status-purchased/20 text-status-purchased border-status-purchased/50",
  },
  listed_for_sale: {
    label: "Anunciado",
    color: "#22D3EE",
    badgeClass: "bg-status-listed/15 text-status-listed border-status-listed/40",
  },
  sold: {
    label: "Vendido",
    color: "#6B7A8C",
    badgeClass: "bg-status-sold/20 text-status-sold border-status-sold/50",
  },
  rejected: {
    label: "Rejeitado",
    color: "#FF4D5E",
    badgeClass: "bg-status-rejected/15 text-status-rejected border-status-rejected/40",
  },
};

export const statusLabel = (s: PropertyStatus | null | undefined) =>
  s ? (STATUS_META[s]?.label ?? s) : "—";

export type RejectionReason =
  | "wetland_fema"
  | "no_legal_road_access"
  | "steep_slope"
  | "landlocked"
  | "other";

export const REJECTION_REASONS: { value: RejectionReason; label: string }[] = [
  { value: "wetland_fema", label: "Área alagável (FEMA)" },
  { value: "no_legal_road_access", label: "Sem acesso legal por estrada" },
  { value: "steep_slope", label: "Declive acentuado" },
  { value: "landlocked", label: "Sem saída (landlocked)" },
  { value: "other", label: "Outro" },
];

export const STATE_NAMES: Record<UsState, string> = {
  AR: "Arkansas",
  MS: "Mississippi",
  AL: "Alabama",
  FL: "Florida",
  NM: "New Mexico",
  AZ: "Arizona",
};
