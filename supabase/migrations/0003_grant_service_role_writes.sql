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

commit;
