-- work_number was globally unique from the original single-variant schema —
-- discovered while QA-testing the HR admin screen: creating any task for a
-- second variant with work_number 1 failed, since the default variant's
-- task #1 already claimed it globally. Uniqueness should be per-variant.

begin;

alter table public.onboarding_tasks drop constraint if exists onboarding_tasks_work_number_key;
alter table public.onboarding_tasks
  add constraint onboarding_tasks_variant_work_number_key unique (variant_id, work_number);

commit;
