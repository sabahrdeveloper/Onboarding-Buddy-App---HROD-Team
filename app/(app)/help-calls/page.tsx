import { createClient } from "@/lib/supabase/server";
import { getEmployee, getSubordinates, getTasks } from "@/lib/data/queries";
import { HelpCallsTabs } from "@/components/help-calls/HelpCallsTabs";
import type { HelpRequestRow } from "@/components/team/TicketCard";

interface RawTicket {
  id: string;
  ticket_id: string;
  employee_enroll_number: string;
  related_task_id: string | null;
  issue_type: string;
  description: string;
  status: string;
  created_at: string;
}

export default async function HelpCallsPage() {
  const supabase = await createClient();
  const [{ data: employee }, { data: tasks }, isManagerRes, isHrRes, isItRes] = await Promise.all([
    getEmployee(),
    getTasks(),
    supabase.rpc("is_manager"),
    supabase.rpc("is_hr_admin"),
    supabase.rpc("is_it_admin"),
  ]);

  const isManager = Boolean(isManagerRes.data);
  const isHr = Boolean(isHrRes.data);
  const isIt = Boolean(isItRes.data);
  const showDirected = isManager || isHr || isIt;

  const taskTitleById = new Map((tasks ?? []).map((t) => [t.id, t.title]));
  const ticketCols = "id, ticket_id, employee_enroll_number, related_task_id, issue_type, description, status, created_at";

  const { data: mineRaw } = employee
    ? await supabase
        .from("help_requests")
        .select(ticketCols)
        .eq("employee_enroll_number", employee.enroll_number)
        .order("created_at", { ascending: false })
    : { data: [] as RawTicket[] };

  // Directed-to-me: union of every role's queue this account holds — a
  // manager's subordinates' tickets, plus company-wide HR/IT queues when
  // applicable. Deduped by id (a ticket can only ever match one role's
  // filter here since assigned_team is single-valued, but the union pattern
  // stays correct if that ever changes).
  const directedRaw: RawTicket[] = [];
  const nameByEnroll = new Map<string, string>();

  if (isManager) {
    const { data: subordinates } = await getSubordinates();
    const enrolls = (subordinates ?? []).map((s) => s.enroll_number);
    for (const s of subordinates ?? []) nameByEnroll.set(s.enroll_number, s.name);
    if (enrolls.length > 0) {
      const { data } = await supabase
        .from("help_requests")
        .select(ticketCols)
        .in("employee_enroll_number", enrolls)
        .order("created_at", { ascending: false });
      directedRaw.push(...(data ?? []));
    }
  }
  if (isHr || isIt) {
    const teams = [isHr && "hr", isIt && "it"].filter((t): t is string => Boolean(t));
    const { data } = await supabase
      .from("help_requests")
      .select(ticketCols)
      .in("assigned_team", teams)
      .order("created_at", { ascending: false });
    directedRaw.push(...(data ?? []));
  }

  const seenIds = new Set<string>();
  const dedupedDirected = directedRaw.filter((t) => (seenIds.has(t.id) ? false : (seenIds.add(t.id), true)));

  const missingNameEnrolls = [...new Set(dedupedDirected.map((t) => t.employee_enroll_number))].filter(
    (e) => !nameByEnroll.has(e),
  );
  if (missingNameEnrolls.length > 0) {
    const { data: namedEmployees } = await supabase
      .from("employees")
      .select("enroll_number, name")
      .in("enroll_number", missingNameEnrolls);
    for (const e of namedEmployees ?? []) nameByEnroll.set(e.enroll_number, e.name);
  }

  function toRow(t: RawTicket, withName: boolean): HelpRequestRow {
    return {
      id: t.id,
      ticketId: t.ticket_id,
      relatedTaskId: t.related_task_id,
      taskTitle: t.related_task_id ? (taskTitleById.get(t.related_task_id) ?? null) : null,
      issueType: t.issue_type,
      description: t.description,
      status: t.status,
      createdAt: t.created_at,
      employeeName: withName ? nameByEnroll.get(t.employee_enroll_number) : undefined,
    };
  }

  const mineTickets = (mineRaw ?? []).map((t) => toRow(t, false));
  const directedTickets = dedupedDirected
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((t) => toRow(t, true));

  return (
    <div>
      <div className="mb-1 mt-0.5 font-en text-xl font-bold text-text">Help Calls</div>
      <div className="mb-4 text-sm font-medium text-muted">আপনার এবং আপনার প্রতি পাঠানো help request</div>

      <HelpCallsTabs mineTickets={mineTickets} directedTickets={directedTickets} showDirected={showDirected} />
    </div>
  );
}
