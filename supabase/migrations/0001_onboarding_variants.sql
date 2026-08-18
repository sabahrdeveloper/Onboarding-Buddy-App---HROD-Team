-- Multi-SBU onboarding variants (Akij Light Engineering) — additive only.
-- Every existing row is backfilled to the "Akij Resource" default variant,
-- so no existing query or employee-facing behavior changes until the
-- application code is deployed to read variant_id. Safe to run against the
-- live database ahead of the code deploy.
--
-- Rollback: see 0001_onboarding_variants.down.sql in this same directory.

begin;

create table if not exists public.onboarding_variants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sbu_aliases text[] not null default '{}',
  logo_url text,
  primary_color text,
  secondary_color text,
  accent_color text,
  background_color text,
  nav_mode text not null default 'kpi' check (nav_mode in ('kpi', 'resources')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one default variant may ever exist — the fallback resolveVariantForSbu
-- lands on when no sbu_aliases match.
create unique index if not exists onboarding_variants_single_default
  on public.onboarding_variants ((is_default))
  where is_default;

alter table public.onboarding_tasks
  add column if not exists variant_id uuid references public.onboarding_variants(id);

alter table public.assessment_templates
  add column if not exists variant_id uuid references public.onboarding_variants(id);

alter table public.milestone_assessment_templates
  add column if not exists variant_id uuid references public.onboarding_variants(id);

alter table public.profiles
  add column if not exists admin_variant_id uuid references public.onboarding_variants(id);

create table if not exists public.resource_links (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.onboarding_variants(id),
  title text not null,
  url text not null,
  category text not null,
  sequence integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resource_links_variant_idx on public.resource_links (variant_id);

-- RLS: resource_links is read-only reference content, same trust level as
-- onboarding_tasks (no per-row RLS on that table today — content readable by
-- any authenticated employee, scoped by variant_id in application queries).
alter table public.resource_links enable row level security;
drop policy if exists resource_links_select on public.resource_links;
create policy resource_links_select on public.resource_links
  for select to authenticated using (true);

-- Seed the default variant (idempotent — matches on slug).
insert into public.onboarding_variants (slug, name, is_default, nav_mode, primary_color, secondary_color)
values ('akij-resource', 'Akij Resource', true, 'kpi', '#2ca24d', '#0c7a35')
on conflict (slug) do nothing;

-- Backfill every existing row to the default variant.
update public.onboarding_tasks
  set variant_id = (select id from public.onboarding_variants where is_default)
  where variant_id is null;

update public.assessment_templates
  set variant_id = (select id from public.onboarding_variants where is_default)
  where variant_id is null;

update public.milestone_assessment_templates
  set variant_id = (select id from public.onboarding_variants where is_default)
  where variant_id is null;

-- Enforce not-null only after backfill.
alter table public.onboarding_tasks alter column variant_id set not null;
alter table public.assessment_templates alter column variant_id set not null;
alter table public.milestone_assessment_templates alter column variant_id set not null;

-- Second variant — content authored later via the HR admin screen, not seeded here.
insert into public.onboarding_variants (slug, name, is_default, nav_mode, sbu_aliases, primary_color, secondary_color)
values (
  'akij-light-engineering',
  'Akij Light Engineering',
  false,
  'resources',
  array['Akij Light Engineering', 'Akij Light Engineering Ltd', 'Akij Light Engineering Ltd.'],
  '#2ca24d',
  '#0c7a35'
)
on conflict (slug) do nothing;

commit;
