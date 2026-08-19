begin;

revoke insert, update, delete on public.badges from service_role;
revoke insert, update, delete on public.contacts from service_role;
revoke select, insert, update, delete on public.help_issue_types from service_role;

drop table if exists public.help_issue_types;

alter table public.badges drop column if exists variant_id;
alter table public.contacts drop column if exists variant_id;
alter table public.help_requests drop column if exists variant_id;

commit;
