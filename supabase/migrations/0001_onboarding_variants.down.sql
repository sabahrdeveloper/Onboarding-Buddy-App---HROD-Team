-- Rollback for 0001_onboarding_variants.sql.
-- Drops everything added; existing onboarding_tasks/assessment_templates/
-- milestone_assessment_templates rows and their data are untouched, only
-- the variant_id column on them is removed.

begin;

alter table public.onboarding_tasks drop column if exists variant_id;
alter table public.assessment_templates drop column if exists variant_id;
alter table public.milestone_assessment_templates drop column if exists variant_id;
alter table public.profiles drop column if exists admin_variant_id;

drop table if exists public.resource_links;
drop table if exists public.onboarding_variants;

commit;
