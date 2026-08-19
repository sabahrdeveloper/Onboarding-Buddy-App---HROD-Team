-- Found while QA-testing task creation: service_role had only
-- SELECT/REFERENCES/TRIGGER/TRUNCATE on onboarding_tasks and resource_links
-- (no INSERT/UPDATE/DELETE), so the admin actions' createAdminClient()
-- writes (which go through PostgREST as service_role, not the Management
-- API superuser connection used to apply earlier migrations) failed with
-- "permission denied for table onboarding_tasks". A pre-existing grant gap,
-- not something the earlier migrations introduced.

begin;

grant insert, update, delete on public.onboarding_tasks to service_role;
grant insert, update, delete on public.resource_links to service_role;
-- Needed so creating a task via the admin screen can backfill
-- employee_task_status rows for that variant's already-provisioned
-- employees (see actions/admin-tasks.ts) — otherwise any employee onboarded
-- before the task existed can never mark it done, and phase-completion math
-- treats the missing row as "already done" for every phase, jumping
-- straight to 180 days. Found during QA of the admin screen.
grant insert, update, delete on public.employee_task_status to service_role;

commit;
