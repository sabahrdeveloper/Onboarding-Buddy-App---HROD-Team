-- Phase 2 of multi-SBU variants: badges, generic fallback contacts, and
-- Help Calls (issue types + ticket routing) become variant-scoped, same
-- additive/backfill-then-not-null pattern as 0001. Safe against the live
-- DB — existing deployed code never reads variant_id on these tables.

begin;

alter table public.badges
  add column if not exists variant_id uuid references public.onboarding_variants(id);

alter table public.contacts
  add column if not exists variant_id uuid references public.onboarding_variants(id);

alter table public.help_requests
  add column if not exists variant_id uuid references public.onboarding_variants(id);

update public.badges
  set variant_id = (select id from public.onboarding_variants where is_default)
  where variant_id is null;

update public.contacts
  set variant_id = (select id from public.onboarding_variants where is_default)
  where variant_id is null;

update public.help_requests
  set variant_id = (select id from public.onboarding_variants where is_default)
  where variant_id is null;

alter table public.badges alter column variant_id set not null;
alter table public.contacts alter column variant_id set not null;
alter table public.help_requests alter column variant_id set not null;

create table if not exists public.help_issue_types (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.onboarding_variants(id),
  label text not null,
  assigned_team text not null check (assigned_team in ('hr', 'it')),
  sequence integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists help_issue_types_variant_idx on public.help_issue_types (variant_id);

alter table public.help_issue_types enable row level security;
drop policy if exists help_issue_types_select on public.help_issue_types;
create policy help_issue_types_select on public.help_issue_types
  for select to authenticated using (true);

-- Seed the default variant's issue types from the previously-hardcoded
-- ISSUE_TYPES list in components/overlays/HelpRequestOverlay.tsx, so the
-- default variant's Help Calls behavior is unchanged after this migration.
insert into public.help_issue_types (variant_id, label, assigned_team, sequence)
select id, label, team, seq
from public.onboarding_variants,
  (values
    ('System Access', 'it', 1),
    ('Policy', 'hr', 2),
    ('KPI / Role', 'hr', 3),
    ('Buddy / Mentor', 'hr', 4),
    ('Training', 'hr', 5),
    ('Other', 'hr', 6)
  ) as seed(label, team, seq)
where onboarding_variants.is_default
on conflict do nothing;

-- service_role grants — same gap discovered in migration 0003, applies to
-- these tables too since the admin screens write through PostgREST as
-- service_role.
grant insert, update, delete on public.badges to service_role;
grant insert, update, delete on public.contacts to service_role;
grant select, insert, update, delete on public.help_issue_types to service_role;

commit;
