-- In-app notifications for HR admin push composer (mirror-app variants
-- only, app-layer gated on navMode='resources' — this table itself is not
-- variant-restricted at the schema level, same as everything else in this
-- migration series). Per-recipient row shape, same convention as the
-- existing kpi_notifications table.

begin;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.onboarding_variants(id),
  recipient_enroll_number text not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx on public.notifications (recipient_enroll_number);

alter table public.notifications enable row level security;

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated
  using (recipient_enroll_number = current_enroll_number());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update to authenticated
  using (recipient_enroll_number = current_enroll_number());

-- No authenticated insert policy — employees never create notifications;
-- HR admin push actions write via the service-role client.
grant select, insert, update on public.notifications to service_role;

commit;
