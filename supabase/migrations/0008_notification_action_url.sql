-- Lets a notification (e.g. "you made the leaderboard top 3") deep-link
-- somewhere other than the default /notifications list — nullable, so
-- every existing notification and every other sender is unaffected.
alter table public.notifications add column action_url text;
