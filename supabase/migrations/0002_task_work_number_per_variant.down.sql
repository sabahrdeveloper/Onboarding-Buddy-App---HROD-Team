begin;

alter table public.onboarding_tasks drop constraint if exists onboarding_tasks_variant_work_number_key;
alter table public.onboarding_tasks add constraint onboarding_tasks_work_number_key unique (work_number);

commit;
