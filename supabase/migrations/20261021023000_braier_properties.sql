create table if not exists public.braier_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.braier_properties (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  card_title text not null check (char_length(btrim(card_title)) > 0),
  title text not null,
  location text not null default '',
  price_label text not null default 'Consultar precio',
  operation text not null check (operation in ('Venta', 'Alquiler', 'Venta Alquiler')),
  property_type text not null check (property_type in ('Casas', 'Departamentos', 'Locales', 'Terrenos', 'Galpones', 'Predios')),
  note text not null default '',
  badges text[] not null default '{}',
  meta text[] not null default '{}',
  description text not null default '',
  features text[] not null default '{}',
  contract text not null default '',
  phone text not null default '+54 351 594 8375',
  whatsapp text not null default '543515948375',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.braier_property_images (
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.braier_properties(id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists braier_properties_sort_idx on public.braier_properties (published, sort_order);
create index if not exists braier_property_images_property_idx on public.braier_property_images (property_id, sort_order);

create or replace function public.braier_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists braier_properties_touch on public.braier_properties;
create trigger braier_properties_touch
before update on public.braier_properties
for each row execute function public.braier_touch_updated_at();

create or replace function public.is_braier_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.braier_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_braier_admin() from public;
grant execute on function public.is_braier_admin() to anon, authenticated;

alter table public.braier_admins enable row level security;
alter table public.braier_properties enable row level security;
alter table public.braier_property_images enable row level security;

drop policy if exists braier_admins_self_read on public.braier_admins;
create policy braier_admins_self_read
on public.braier_admins
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists braier_properties_read on public.braier_properties;
create policy braier_properties_read
on public.braier_properties
for select
to anon, authenticated
using (published or public.is_braier_admin());

drop policy if exists braier_properties_admin_insert on public.braier_properties;
create policy braier_properties_admin_insert
on public.braier_properties
for insert
to authenticated
with check (public.is_braier_admin());

drop policy if exists braier_properties_admin_update on public.braier_properties;
create policy braier_properties_admin_update
on public.braier_properties
for update
to authenticated
using (public.is_braier_admin())
with check (public.is_braier_admin());

drop policy if exists braier_properties_admin_delete on public.braier_properties;
create policy braier_properties_admin_delete
on public.braier_properties
for delete
to authenticated
using (public.is_braier_admin());

drop policy if exists braier_images_read on public.braier_property_images;
create policy braier_images_read
on public.braier_property_images
for select
to anon, authenticated
using (
  public.is_braier_admin()
  or exists (
    select 1 from public.braier_properties p
    where p.id = property_id and p.published
  )
);

drop policy if exists braier_images_admin_insert on public.braier_property_images;
create policy braier_images_admin_insert
on public.braier_property_images
for insert
to authenticated
with check (public.is_braier_admin());

drop policy if exists braier_images_admin_update on public.braier_property_images;
create policy braier_images_admin_update
on public.braier_property_images
for update
to authenticated
using (public.is_braier_admin())
with check (public.is_braier_admin());

drop policy if exists braier_images_admin_delete on public.braier_property_images;
create policy braier_images_admin_delete
on public.braier_property_images
for delete
to authenticated
using (public.is_braier_admin());

grant select on public.braier_properties to anon, authenticated;
grant insert, update, delete on public.braier_properties to authenticated;
grant select on public.braier_property_images to anon, authenticated;
grant insert, update, delete on public.braier_property_images to authenticated;
grant select on public.braier_admins to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'braier-properties',
  'braier-properties',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists braier_storage_public_read on storage.objects;
create policy braier_storage_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'braier-properties');

drop policy if exists braier_storage_admin_insert on storage.objects;
create policy braier_storage_admin_insert
on storage.objects
for insert
to authenticated
with check (bucket_id = 'braier-properties' and public.is_braier_admin());

drop policy if exists braier_storage_admin_update on storage.objects;
create policy braier_storage_admin_update
on storage.objects
for update
to authenticated
using (bucket_id = 'braier-properties' and public.is_braier_admin())
with check (bucket_id = 'braier-properties' and public.is_braier_admin());

drop policy if exists braier_storage_admin_delete on storage.objects;
create policy braier_storage_admin_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'braier-properties' and public.is_braier_admin());
