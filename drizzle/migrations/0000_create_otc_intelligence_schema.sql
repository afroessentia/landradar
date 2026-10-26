do $$ begin
  create type property_status as enum (
    'new_detected','due_diligence','ready_to_buy','purchased',
    'listed_for_sale','sold','rejected'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type us_state as enum ('AR','MS','AL','FL','NM','AZ');
exception when duplicate_object then null; end $$;

create table if not exists public.counties_states (
  id               uuid primary key default gen_random_uuid(),
  state            us_state not null,
  county_name      text not null,
  portal_buy_url   text,
  gis_url_template text,
  apify_task_id    text,
  is_active        boolean not null default true,
  unique (state, county_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counties_states TO authenticated;
GRANT ALL ON public.counties_states TO service_role;

create table if not exists public.otc_properties (
  id                         uuid primary key default gen_random_uuid(),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  county_state_id            uuid not null references public.counties_states(id) on delete restrict,
  parcel_id                  text not null,
  legal_description          text,
  subdivision                text,
  acreage                    numeric(12,3),
  otc_price                  numeric(12,2),
  target_sale_price          numeric(12,2) default 1990,
  latitude                   numeric(10,7),
  longitude                  numeric(10,7),
  direct_buy_url             text,
  status                     property_status not null default 'new_detected',
  rejection_reason           text,
  due_diligence_checklist    jsonb not null default
    '{"road_access":null,"flood_zone":null,"zoning":null,"tax_status":null}'::jsonb,
  marketing_copy_generated   text,
  favorite                   boolean not null default false,
  notes                      text,
  raw_payload                jsonb,
  constraint uq_county_parcel unique (county_state_id, parcel_id),
  constraint chk_checklist_keys check (
    due_diligence_checklist ?& array['road_access','flood_zone','zoning','tax_status']
  ),
  constraint chk_rejection check (status <> 'rejected' or rejection_reason is not null)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.otc_properties TO authenticated;
GRANT ALL ON public.otc_properties TO service_role;

create index if not exists idx_props_parcel     on public.otc_properties (parcel_id);
create index if not exists idx_props_price      on public.otc_properties (otc_price);
create index if not exists idx_props_status     on public.otc_properties (status);
create index if not exists idx_props_county     on public.otc_properties (county_state_id);
create index if not exists idx_props_acreage    on public.otc_properties (acreage);
create index if not exists idx_props_fav        on public.otc_properties (favorite) where favorite;
create index if not exists idx_props_has_gps    on public.otc_properties (id) where latitude is not null and longitude is not null;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_props_updated on public.otc_properties;
create trigger trg_props_updated before update on public.otc_properties
for each row execute function public.set_updated_at();

create or replace view public.v_properties as
select
  p.*,
  c.state,
  c.county_name,
  c.portal_buy_url,
  case when c.gis_url_template is not null
       then replace(c.gis_url_template, '{PARCEL}', p.parcel_id) end as gis_url,
  case when p.latitude is not null and p.longitude is not null
       then 'https://www.google.com/maps/@' || p.latitude || ',' || p.longitude || ',18z/data=!3m1!1e3' end as satellite_url,
  (coalesce(p.target_sale_price,0) - coalesce(p.otc_price,0)) as est_margin
from public.otc_properties p
join public.counties_states c on c.id = p.county_state_id;
GRANT SELECT ON public.v_properties TO authenticated;
GRANT ALL ON public.v_properties TO service_role;

alter view public.v_properties set (security_invoker = on);

alter table public.counties_states enable row level security;
alter table public.otc_properties  enable row level security;

drop policy if exists "auth all counties" on public.counties_states;
create policy "auth all counties" on public.counties_states
  for all to authenticated using (true) with check (true);

drop policy if exists "auth all props" on public.otc_properties;
create policy "auth all props" on public.otc_properties
  for all to authenticated using (true) with check (true);