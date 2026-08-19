begin;

revoke insert, update, delete on public.onboarding_tasks from service_role;
revoke insert, update, delete on public.resource_links from service_role;
revoke insert, update, delete on public.employee_task_status from service_role;

commit;
