create table public.braier_appraisals (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  phone text not null check (char_length(btrim(phone)) between 6 and 40),
  email text not null default '',
  property_type text not null check (property_type in ('Casa', 'Departamento', 'Local', 'Terreno', 'Galpón', 'Predio')),
  location text not null default '',
  comment text not null default '',
  created_at timestamptz not null default now()
);

alter table public.braier_appraisals enable row level security;

revoke all on table public.braier_appraisals from public, anon, authenticated;
grant insert on table public.braier_appraisals to anon, authenticated;
grant select on table public.braier_appraisals to authenticated;

drop policy if exists braier_appraisals_public_insert on public.braier_appraisals;
create policy braier_appraisals_public_insert
on public.braier_appraisals
for insert
to anon, authenticated
with check (char_length(btrim(full_name)) between 2 and 120 and char_length(btrim(phone)) between 6 and 40);

drop policy if exists braier_appraisals_admin_read on public.braier_appraisals;
create policy braier_appraisals_admin_read
on public.braier_appraisals
for select
to authenticated
using (public.is_braier_admin());
