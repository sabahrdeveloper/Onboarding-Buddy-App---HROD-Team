-- Journey-scoped MCQ/open-answer assessments for dynamic-journey (non-default)
-- variants — a completely separate model from assessment_templates (the
-- default variant's 1-5 satisfaction-rating system): scored questions with
-- an HR-editable answer key and per-question marks, one-time submission,
-- gates journey completion, and feeds a combined-score leaderboard.

create table public.journey_assessments (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.onboarding_phases(id) unique,
  variant_id uuid not null references public.onboarding_variants(id),
  created_at timestamptz not null default now()
);

create table public.journey_assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.journey_assessments(id) on delete cascade,
  type text not null check (type in ('mcq', 'open')),
  question_text text not null,
  -- mcq: [{"key":"ক","text":"..."}, ...]; null for open questions
  options jsonb,
  -- mcq only: the option key that scores full marks
  correct_option_key text,
  marks numeric not null default 1 check (marks >= 0),
  sequence integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.journey_assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  employee_enroll_number text not null,
  assessment_id uuid not null references public.journey_assessments(id),
  journey_id uuid not null references public.onboarding_phases(id),
  variant_id uuid not null references public.onboarding_variants(id),
  score numeric not null default 0,
  submitted_at timestamptz not null default now(),
  unique (employee_enroll_number, assessment_id)
);

create table public.journey_assessment_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.journey_assessment_submissions(id) on delete cascade,
  question_id uuid not null references public.journey_assessment_questions(id),
  answer_text text,
  selected_option_key text,
  marks_awarded numeric not null default 0
);

-- One photo per employee, deleted outright the moment they're bumped from
-- the top 3 (not just hidden) — storage_path is what gets removed from the
-- bucket alongside the row. No rank column: rank shifts as more employees
-- submit, so it's always computed live from journey_assessment_submissions,
-- never persisted here.
create table public.leaderboard_photos (
  employee_enroll_number text primary key,
  variant_id uuid not null references public.onboarding_variants(id),
  storage_path text not null,
  updated_at timestamptz not null default now()
);

-- HR-facing "employee finished a journey" feed — deliberately separate from
-- the existing employee-facing `notifications` table (different recipient
-- model: any HR admin scoped to the variant sees it, not one enroll number).
create table public.hr_journey_completion_notifications (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.onboarding_variants(id),
  employee_enroll_number text not null,
  journey_id uuid not null references public.onboarding_phases(id),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.journey_assessments enable row level security;
alter table public.journey_assessment_questions enable row level security;
alter table public.journey_assessment_submissions enable row level security;
alter table public.journey_assessment_answers enable row level security;
alter table public.leaderboard_photos enable row level security;
alter table public.hr_journey_completion_notifications enable row level security;

-- Employees never read journey_assessment_questions directly (it would leak
-- correct_option_key) — the assessment-taking page is server-rendered via
-- the service-role client, which strips the answer key before it ever
-- reaches a client component. No authenticated select policy is added here
-- on purpose; only service_role (via grants below) can read this table.
create policy leaderboard_photos_select on public.leaderboard_photos for select to authenticated using (true);
create policy hr_journey_completion_select on public.hr_journey_completion_notifications for select to authenticated using (true);

grant select, insert, update, delete on public.journey_assessments to service_role;
grant select, insert, update, delete on public.journey_assessment_questions to service_role;
grant select, insert, update, delete on public.journey_assessment_submissions to service_role;
grant select, insert, update, delete on public.journey_assessment_answers to service_role;
grant select, insert, update, delete on public.leaderboard_photos to service_role;
grant select, insert, update, delete on public.hr_journey_completion_notifications to service_role;

-- Seed an (initially empty) assessment row for the existing Light
-- Engineering journey so the admin screen has something to attach
-- questions to immediately.
insert into public.journey_assessments (journey_id, variant_id)
values (
  (select id from public.onboarding_phases where variant_id = 'bc0cc352-27e8-4f34-aa52-d42c1ba1a0af' limit 1),
  'bc0cc352-27e8-4f34-aa52-d42c1ba1a0af'
);
