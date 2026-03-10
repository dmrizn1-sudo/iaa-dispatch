-- Schema for Israel Air & Ambulance dispatch system

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'call_status') then
    create type call_status as enum ('חדשה', 'שובצה', 'בדרך', 'הגיע', 'הסתיים', 'נסגר חשבונית');
  end if;
  if not exists (select 1 from pg_type where typname = 'vehicle_status') then
    create type vehicle_status as enum ('פנוי', 'במשימה', 'תחזוקה');
  end if;
  if not exists (select 1 from pg_type where typname = 'driver_status') then
    create type driver_status as enum ('פעיל', 'לא פעיל');
  end if;
  if not exists (select 1 from pg_type where typname = 'vehicle_type') then
    create type vehicle_type as enum ('אמבולנס ביטחון', 'אמבולנס ALS', 'אמבולנס רגיל');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('לא שולם', 'שולם מזומן', 'שולם אשראי', 'שולם קופת חולים', 'שולם העברה בנקאית');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type user_status as enum ('pending', 'approved', 'rejected', 'blocked');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'dispatcher', 'driver');
  end if;
  if not exists (select 1 from pg_type where typname = 'equipment_category') then
    create type equipment_category as enum ('airway', 'breathing', 'circulation', 'trauma', 'monitoring', 'medications', 'immobilization', 'general');
  end if;
  if not exists (select 1 from pg_type where typname = 'equipment_type') then
    create type equipment_type as enum ('BLS', 'ALS', 'both');
  end if;
  if not exists (select 1 from pg_type where typname = 'equipment_condition') then
    create type equipment_condition as enum ('תקין', 'חסר', 'פגום');
  end if;
end$$;

-- Extend existing enum values safely (if already created in older deployments)
do $$
begin
  begin
    alter type call_status add value if not exists 'ממתין חשבונית';
  exception when duplicate_object then null;
  end;
  begin
    alter type call_status add value if not exists 'נסגר';
  exception when duplicate_object then null;
  end;
end$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null unique,
  role user_role not null default 'dispatcher',
  status user_status not null default 'pending',
  national_id_enc text,
  national_id_last4 text,
  job_title text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id)
);

create index if not exists app_users_auth_user_id_idx on public.app_users (auth_user_id);
create index if not exists app_users_status_idx on public.app_users (status);
create index if not exists app_users_role_idx on public.app_users (role);

create table if not exists public.registration_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  role_requested user_role not null default 'dispatcher',
  national_id_enc text,
  national_id_last4 text,
  notes text,
  status user_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create index if not exists regreq_status_idx on public.registration_requests (status);
create index if not exists regreq_created_at_idx on public.registration_requests (created_at desc);

create table if not exists public.equipment_master (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  category equipment_category not null,
  required_quantity integer not null default 1,
  equipment_type equipment_type not null default 'both',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists equipment_master_category_idx on public.equipment_master (category);
create index if not exists equipment_master_type_idx on public.equipment_master (equipment_type);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  national_id_enc text,
  national_id_last4 text,
  license_type text,
  status driver_status not null default 'פעיל',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists drivers_status_idx on public.drivers (status);
create index if not exists drivers_name_idx on public.drivers (name);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_number text not null unique,
  vehicle_type vehicle_type not null,
  plate text not null,
  status vehicle_status not null default 'פנוי',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_status_idx on public.vehicles (status);
create index if not exists vehicles_vehicle_number_idx on public.vehicles (vehicle_number);

create table if not exists public.vehicle_equipment (
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  equipment_id uuid not null references public.equipment_master(id) on delete cascade,
  required_quantity integer not null default 1,
  last_checked timestamptz,
  status text,
  primary key (vehicle_id, equipment_id)
);

create table if not exists public.equipment_check_reports (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  driver_id uuid references public.drivers(id),
  checked_by uuid not null references auth.users(id),
  date date not null,
  shift text not null,
  status text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists equipment_check_reports_vehicle_date_idx on public.equipment_check_reports (vehicle_id, date desc);

create table if not exists public.equipment_check_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.equipment_check_reports(id) on delete cascade,
  equipment_id uuid not null references public.equipment_master(id) on delete restrict,
  required_quantity integer not null,
  actual_quantity integer not null,
  condition equipment_condition not null,
  notes text
);

create index if not exists equipment_check_items_report_idx on public.equipment_check_items (report_id);

create table if not exists public.equipment_alerts (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  report_id uuid references public.equipment_check_reports(id) on delete set null,
  equipment_id uuid references public.equipment_master(id) on delete set null,
  condition equipment_condition not null,
  message text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists equipment_alerts_vehicle_idx on public.equipment_alerts (vehicle_id, resolved, created_at desc);

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  call_no bigint generated always as identity,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete restrict,

  date date not null,
  time time not null,
  call_type text not null,
  status call_status not null default 'חדשה',

  first_name text not null,
  last_name text not null,
  national_id text not null,

  from_place text not null,
  from_department text,
  to_place text not null,
  to_department text,

  health_fund text,
  contact_name text,
  contact_phone text,
  commitment_no text,
  -- Legacy free-text fields kept for backward compatibility
  driver text,
  vehicle_no text,
  -- Operational assignment fields
  driver_id uuid references public.drivers(id),
  vehicle_id uuid references public.vehicles(id),
  notes text,

  -- Financial closure
  invoice_number text,
  receipt_number text,
  payment_status payment_status not null default 'לא שולם',
  payment_method text,
  amount numeric(12,2),
  finance_notes text,

  closed_at timestamptz,
  closed_by uuid references auth.users(id)
);

create index if not exists calls_created_at_idx on public.calls (created_at desc);
create index if not exists calls_closed_at_idx on public.calls (closed_at desc);
create index if not exists calls_status_idx on public.calls (status);
create index if not exists calls_call_no_idx on public.calls (call_no desc);
create index if not exists calls_driver_id_idx on public.calls (driver_id);
create index if not exists calls_vehicle_id_idx on public.calls (vehicle_id);

alter table public.calls enable row level security;
alter table public.app_users enable row level security;
alter table public.registration_requests enable row level security;
alter table public.drivers enable row level security;
alter table public.vehicles enable row level security;
alter table public.equipment_master enable row level security;
alter table public.vehicle_equipment enable row level security;
alter table public.equipment_check_reports enable row level security;
alter table public.equipment_check_items enable row level security;
alter table public.equipment_alerts enable row level security;

create table if not exists public.call_audit_log (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  actor_role user_role,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists call_audit_call_id_idx on public.call_audit_log (call_id, created_at desc);

create or replace function public.is_approved_user()
returns boolean
language sql
stable
as $$
  exists (
    select 1
    from public.app_users u
    where u.auth_user_id = auth.uid()
      and u.status = 'approved'
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  exists (
    select 1
    from public.app_users u
    where u.auth_user_id = auth.uid()
      and u.status = 'approved'
      and u.role = 'admin'
  )
$$;

create or replace function public.is_dispatcher_or_admin()
returns boolean
language sql
stable
as $$
  exists (
    select 1
    from public.app_users u
    where u.auth_user_id = auth.uid()
      and u.status = 'approved'
      and u.role in ('admin', 'dispatcher')
  )
$$;

create or replace function public.current_driver_id()
returns uuid
language sql
stable
as $$
  (
    select d.id
    from public.app_users u
    join public.drivers d on d.phone = u.phone
    where u.auth_user_id = auth.uid()
      and u.status = 'approved'
      and u.role = 'driver'
      and d.status = 'פעיל'
    limit 1
  )
$$;

-- Basic RLS: authenticated users can CRUD their organization calls.
-- For a real production deployment, you may want a roles table or use Supabase "teams" patterns.
create policy "calls_select_authenticated"
on public.calls for select
to authenticated
using (
  public.is_dispatcher_or_admin()
  or (public.is_approved_user() and driver_id is not null and driver_id = public.current_driver_id())
);

create policy "calls_insert_authenticated"
on public.calls for insert
to authenticated
with check (public.is_approved_user() and auth.uid() = created_by);

create policy "calls_update_authenticated"
on public.calls for update
to authenticated
using (public.is_dispatcher_or_admin() or (public.is_approved_user() and driver_id = public.current_driver_id()))
with check (public.is_dispatcher_or_admin() or (public.is_approved_user() and driver_id = public.current_driver_id()));

-- drivers/vehicles: readable by approved users, manageable by admins
create policy "drivers_select_approved"
on public.drivers for select
to authenticated
using (public.is_approved_user());

create policy "drivers_modify_admin"
on public.drivers for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "vehicles_select_approved"
on public.vehicles for select
to authenticated
using (public.is_approved_user());

create policy "vehicles_modify_admin"
on public.vehicles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- equipment master: only admins manage, everyone approved can read
create policy "equipment_master_select_approved"
on public.equipment_master for select
to authenticated
using (public.is_approved_user());

create policy "equipment_master_modify_admin"
on public.equipment_master for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- vehicle_equipment + equipment checks: dispatcher/admin/driver
create policy "vehicle_equipment_select_approved"
on public.vehicle_equipment for select
to authenticated
using (public.is_approved_user());

create policy "vehicle_equipment_modify_admin"
on public.vehicle_equipment for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "equipment_checks_select_approved"
on public.equipment_check_reports for select
to authenticated
using (public.is_approved_user());

create policy "equipment_checks_insert_dispatcher_driver"
on public.equipment_check_reports for insert
to authenticated
with check (public.is_dispatcher_or_admin() or (public.is_approved_user()));

create policy "equipment_checks_items_all"
on public.equipment_check_items for all
to authenticated
using (public.is_dispatcher_or_admin() or public.is_approved_user())
with check (public.is_dispatcher_or_admin() or public.is_approved_user());

create policy "equipment_alerts_select_approved"
on public.equipment_alerts for select
to authenticated
using (public.is_approved_user());

create policy "equipment_alerts_modify_dispatcher_admin"
on public.equipment_alerts for all
to authenticated
using (public.is_dispatcher_or_admin())
with check (public.is_dispatcher_or_admin());

create policy "audit_select_dispatcher_admin"
on public.call_audit_log for select
to authenticated
using (public.is_dispatcher_or_admin() or (call_id in (select id from public.calls where driver_id = public.current_driver_id())));

create policy "audit_insert_dispatcher_admin"
on public.call_audit_log for insert
to authenticated
with check (public.is_dispatcher_or_admin() or public.is_approved_user());

-- app_users: users can read their own row; admins can manage.
create policy "app_users_select_self"
on public.app_users for select
to authenticated
using (auth.uid() = auth_user_id);

create policy "app_users_select_admin"
on public.app_users for select
to authenticated
using (public.is_admin());

create policy "app_users_update_admin"
on public.app_users for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "app_users_insert_admin"
on public.app_users for insert
to authenticated
with check (public.is_admin());

-- registration_requests: anyone can create a request; only admins can read/update.
create policy "registration_requests_insert_anyone"
on public.registration_requests for insert
to anon, authenticated
with check (true);

create policy "registration_requests_select_admin"
on public.registration_requests for select
to authenticated
using (public.is_admin());

create policy "registration_requests_update_admin"
on public.registration_requests for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

