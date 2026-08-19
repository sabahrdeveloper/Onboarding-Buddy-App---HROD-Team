update public.onboarding_tasks
set phase = '30'
where variant_id = 'bc0cc352-27e8-4f34-aa52-d42c1ba1a0af';

alter table public.onboarding_tasks
  add constraint onboarding_tasks_phase_check check (phase = any (array['30'::text, '60'::text, '90'::text]));

drop policy if exists onboarding_phases_select on public.onboarding_phases;
drop table if exists public.onboarding_phases;
