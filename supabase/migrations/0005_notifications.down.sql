begin;

revoke select, insert, update on public.notifications from service_role;
drop table if exists public.notifications;

commit;
