export type PropertyStatus =
  | "new_detected"
  | "due_diligence"
  | "ready_to_buy"
  | "purchased"
  | "listed_for_sale"
  | "sold"
  | "rejected";

export type UsState = "AR" | "MS" | "AL" | "FL" | "NM" | "AZ";

/** null = não verificado */
export type ChecklistValue = true | false | null;

export interface DueDiligenceChecklist {
  road_access: ChecklistValue;
  flood_zone: ChecklistValue;
  zoning: ChecklistValue;
  tax_status: ChecklistValue;
}

export interface County {
  id: string;
  state: UsState;
  county_name: string;
  portal_buy_url: string | null;
  gis_url_template: string | null;
  apify_task_id: string | null;
  is_active: boolean;
}

/** Formato da view v_properties */
export interface Property {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  county_state_id: string;
  parcel_id: string;
  legal_description: string | null;
  subdivision: string | null;
  acreage: number | null;
  otc_price: number | null;
  target_sale_price: number | null;
  latitude: number | null;
  longitude: number | null;
  direct_buy_url: string | null;
  status: PropertyStatus;
  rejection_reason: string | null;
  due_diligence_checklist: DueDiligenceChecklist;
  marketing_copy_generated: string | null;
  favorite: boolean;
  notes: string | null;
  state: UsState | null;
  county_name: string | null;
  portal_buy_url: string | null;
  gis_url: string | null;
  satellite_url: string | null;
  est_margin: number | null;
}

export type PropertySortBy = "est_margin" | "otc_price" | "acreage" | "created_at";

export interface PropertyFilters {
  states: UsState[];
  maxPrice: number;
  minAcreage: number;
  onlyWithGps: boolean;
  statuses: PropertyStatus[];
  onlyFavorites: boolean;
  /** busca em parcel_id e county_name */
  search: string;
  sortBy: PropertySortBy;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export const ALL_STATUSES: PropertyStatus[] = [
  "new_detected",
  "due_diligence",
  "ready_to_buy",
  "purchased",
  "listed_for_sale",
  "sold",
  "rejected",
];

export const DEFAULT_FILTERS: PropertyFilters = {
  states: [],
  maxPrice: 800,
  minAcreage: 0,
  onlyWithGps: false,
  statuses: ALL_STATUSES.filter((s) => s !== "rejected" && s !== "sold"),
  onlyFavorites: false,
  search: "",
  sortBy: "est_margin",
  sortDir: "desc",
  page: 0,
  pageSize: 50,
};

export const EMPTY_CHECKLIST: DueDiligenceChecklist = {
  road_access: null,
  flood_zone: null,
  zoning: null,
  tax_status: null,
};

export type PropertyPatch = Partial<
  Pick<
    Property,
    | "due_diligence_checklist"
    | "status"
    | "rejection_reason"
    | "favorite"
    | "notes"
    | "target_sale_price"
    | "latitude"
    | "longitude"
    | "direct_buy_url"
    | "marketing_copy_generated"
  >
>;

export interface NewProperty {
  county_state_id: string;
  parcel_id: string;
  legal_description?: string | null;
  subdivision?: string | null;
  acreage?: number | null;
  otc_price?: number | null;
  target_sale_price?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  direct_buy_url?: string | null;
  status?: PropertyStatus;
  notes?: string | null;
}
