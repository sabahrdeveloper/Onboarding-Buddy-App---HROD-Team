create table public.onboarding_phases (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.onboarding_variants(id),
  name text not null,
  sequence integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index onboarding_phases_variant_idx on public.onboarding_phases(variant_id);

alter table public.onboarding_phases enable row level security;

create policy onboarding_phases_select on public.onboarding_phases
  for select to authenticated using (true);

grant select, insert, update, delete on public.onboarding_phases to service_role;

-- onboarding_tasks.phase was constrained to the default variant's fixed
-- '30'/'60'/'90' set; non-default variants now store an onboarding_phases.id
-- (uuid as text) here instead, so the check moves to the app layer.
alter table public.onboarding_tasks drop constraint if exists onboarding_tasks_phase_check;

-- Seed one journey for the existing Light Engineering / Sales Onboarding
-- content, and backfill its 14 tasks to reference it by id (replacing the
-- placeholder phase='30' text value).
insert into public.onboarding_phases (variant_id, name, sequence)
values ('bc0cc352-27e8-4f34-aa52-d42c1ba1a0af', 'Sales Onboarding Journey', 1);

update public.onboarding_tasks
set phase = (
  select id::text from public.onboarding_phases
  where variant_id = 'bc0cc352-27e8-4f34-aa52-d42c1ba1a0af'
  limit 1
)
where variant_id = 'bc0cc352-27e8-4f34-aa52-d42c1ba1a0af';
