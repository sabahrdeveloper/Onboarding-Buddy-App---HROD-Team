-- Employees could never see their own submitted status (no select policy
-- existed at all), so getMySubmittedAssessmentJourneyIds() always read an
-- empty set on a fresh page load — the assessment CTA/gate looked correct
-- only within the same session via optimistic client state, then appeared
-- "resubmittable" after any reload/re-login. Scores/submission metadata
-- carry no answer-key data, so this is safe to expose per-employee.
create policy journey_assessment_submissions_select_own on public.journey_assessment_submissions
  for select to authenticated
  using (employee_enroll_number = current_enroll_number());
