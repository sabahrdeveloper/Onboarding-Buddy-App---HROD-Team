import { createAdminClient } from "@/lib/supabase/admin";
import { mapOnboardingVariant, resolveVariantForSbu } from "@/lib/onboarding-variant";

type Admin = ReturnType<typeof createAdminClient>;

// PostgREST caps a single select at 1000 rows — employee_task_status is
// company-wide and already past that, so every report reading it must page
// through, not do one .select() and trust it came back complete. This was
// the root cause of every report below silently showing 0/0 for most
// employees.
async function fetchAllTaskStatuses(admin: Admin) {
  const rows: { employee_enroll_number: string; task_id: string; done: boolean }[] = [];
  const PAGE_SIZE = 1000;
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("employee_task_status")
      .select("employee_enroll_number, task_id, done")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

// Remote MCP endpoint — lives on the same always-on Vercel deployment as the
// app, so it works even when the dev's own machine is off. Bearer-token gated
// (MCP_TOKEN env var) since this is a public URL backed by the service-role
// client. Plain JSON-RPC 2.0 over POST (MCP's "Streamable HTTP" transport,
// non-streaming form — every response here is a single JSON object).

const TOOLS = [
  {
    name: "onboarding_progress_report",
    description: "Every employee's onboarding task completion (done/total), optionally filtered by SBU.",
    inputSchema: { type: "object", properties: { sbu: { type: "string", description: "Optional SBU filter" } } },
  },
  {
    name: "sales_onboarding_report",
    description:
      "Full report on a non-default onboarding variant (e.g. Sales Onboarding / Akij Light Engineering): per-employee task completion scoped to that variant only, per-journey breakdown, and assessment status. Defaults to the first non-default variant if variant_slug is omitted.",
    inputSchema: {
      type: "object",
      properties: { variant_slug: { type: "string", description: "e.g. 'akij-light-engineering'; default: the (only) non-default variant" } },
    },
  },
  {
    name: "employee_kpi_report",
    description: "Employee KPI submission status counts (pending/approved/rejected) for a month (YYYY-MM), default current month.",
    inputSchema: { type: "object", properties: { period_month: { type: "string", description: "YYYY-MM, default current" } } },
  },
  {
    name: "help_ticket_report",
    description: "Help ticket counts by status and assigned team, optionally filtered by status.",
    inputSchema: { type: "object", properties: { status: { type: "string", description: "Optional status filter" } } },
  },
  {
    name: "employee_list",
    description: "List of everyone using OnboardingBuddy: enroll number, name, SBU, department, email.",
    inputSchema: { type: "object", properties: { sbu: { type: "string", description: "Optional SBU filter" } } },
  },
  {
    name: "query_table",
    description:
      "Read-only lookup on any app data table (employees, kpi_submissions, kpi_items, help_requests, employee_task_status, onboarding_tasks, etc). Never has access to login/auth data. Use for anything the other report tools don't cover.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string", description: "Table name, e.g. 'kpi_items'" },
        columns: { type: "string", description: "Comma-separated columns, default all" },
        filters: { type: "object", description: "Optional column:value equality filters" },
        limit: { type: "number", description: "Max rows, default 50, hard cap 500" },
      },
      required: ["table"],
    },
  },
] as const;

async function onboardingProgressReport({ sbu }: { sbu?: string }) {
  const supabase = createAdminClient();
  let q = supabase.from("employees").select("enroll_number, name, sbu, department");
  if (sbu) q = q.eq("sbu", sbu);
  const { data: employees, error } = await q;
  if (error) throw new Error(error.message);

  const statuses = await fetchAllTaskStatuses(supabase);
  const doneCount = new Map<string, number>();
  const totalCount = new Map<string, number>();
  for (const s of statuses) {
    totalCount.set(s.employee_enroll_number, (totalCount.get(s.employee_enroll_number) ?? 0) + 1);
    if (s.done) doneCount.set(s.employee_enroll_number, (doneCount.get(s.employee_enroll_number) ?? 0) + 1);
  }

  return (employees ?? []).map((e) => ({
    enroll_number: e.enroll_number,
    name: e.name,
    sbu: e.sbu,
    department: e.department,
    tasks_done: doneCount.get(e.enroll_number) ?? 0,
    tasks_total: totalCount.get(e.enroll_number) ?? 0,
  }));
}

// Reports on a non-default onboarding variant specifically (e.g. "Sales
// Onboarding" / Akij Light Engineering) — scoped to that variant's own
// tasks only, not mixed with the default 50-task checklist a dual-track
// employee may also be provisioned for. Covers what onboarding_progress_report
// can't: which variant, per-journey breakdown, and assessment status.
async function salesOnboardingReport({ variant_slug }: { variant_slug?: string }) {
  const admin = createAdminClient();

  const { data: variantsData, error: variantsError } = await admin.from("onboarding_variants").select("*");
  if (variantsError) throw new Error(variantsError.message);
  const variants = (variantsData ?? []).map(mapOnboardingVariant);
  const variant = variant_slug
    ? variants.find((v) => v.slug === variant_slug)
    : variants.find((v) => !v.isDefault);
  if (!variant) throw new Error(variant_slug ? `Unknown variant slug: ${variant_slug}` : "No non-default variant configured");

  const { data: allEmployees, error: employeesError } = await admin.from("employees").select("enroll_number, name, sbu, department");
  if (employeesError) throw new Error(employeesError.message);
  const employees = (allEmployees ?? []).filter((e) => resolveVariantForSbu(e.sbu, variants).id === variant.id);
  const enrollNumbers = employees.map((e) => e.enroll_number);

  const [{ data: tasks, error: tasksError }, { data: phases, error: phasesError }] = await Promise.all([
    admin.from("onboarding_tasks").select("id, phase, active").eq("variant_id", variant.id),
    admin.from("onboarding_phases").select("id, name, sequence").eq("variant_id", variant.id).order("sequence"),
  ]);
  if (tasksError) throw new Error(tasksError.message);
  if (phasesError) throw new Error(phasesError.message);
  const activeTaskIds = new Set((tasks ?? []).filter((t) => t.active).map((t) => t.id));
  const phaseNameById = new Map((phases ?? []).map((p) => [p.id, p.name]));
  const totalTasks = activeTaskIds.size;

  const allStatuses = await fetchAllTaskStatuses(admin);
  const statusesByEmployee = new Map<string, Set<string>>();
  for (const s of allStatuses) {
    if (!s.done || !activeTaskIds.has(s.task_id) || !enrollNumbers.includes(s.employee_enroll_number)) continue;
    if (!statusesByEmployee.has(s.employee_enroll_number)) statusesByEmployee.set(s.employee_enroll_number, new Set());
    statusesByEmployee.get(s.employee_enroll_number)!.add(s.task_id);
  }

  const { data: submissions, error: submissionsError } = await admin
    .from("journey_assessment_submissions")
    .select("employee_enroll_number, score, submitted_at")
    .eq("variant_id", variant.id);
  if (submissionsError) throw new Error(submissionsError.message);
  const submissionByEmployee = new Map((submissions ?? []).map((s) => [s.employee_enroll_number, s]));

  const employeeReports = employees.map((e) => {
    const doneIds = statusesByEmployee.get(e.enroll_number) ?? new Set<string>();
    const byPhase: Record<string, { done: number; total: number }> = {};
    for (const t of tasks ?? []) {
      if (!activeTaskIds.has(t.id)) continue;
      const phaseName = phaseNameById.get(t.phase) ?? t.phase;
      if (!byPhase[phaseName]) byPhase[phaseName] = { done: 0, total: 0 };
      byPhase[phaseName].total++;
      if (doneIds.has(t.id)) byPhase[phaseName].done++;
    }
    const submission = submissionByEmployee.get(e.enroll_number);
    return {
      enroll_number: e.enroll_number,
      name: e.name,
      sbu: e.sbu,
      department: e.department,
      tasks_done: doneIds.size,
      tasks_total: totalTasks,
      by_journey: byPhase,
      assessment_taken: Boolean(submission),
      assessment_score: submission?.score ?? null,
      assessment_submitted_at: submission?.submitted_at ?? null,
    };
  });

  return {
    variant: { slug: variant.slug, name: variant.name },
    employee_count: employees.length,
    completed_all_tasks: employeeReports.filter((e) => e.tasks_total > 0 && e.tasks_done >= e.tasks_total).length,
    assessment_taken_count: employeeReports.filter((e) => e.assessment_taken).length,
    employees: employeeReports,
  };
}

async function employeeKpiReport({ period_month }: { period_month?: string }) {
  const supabase = createAdminClient();
  const period = period_month || new Date().toISOString().slice(0, 7);
  const { data, error } = await supabase
    .from("kpi_submissions")
    .select("employee_enroll_number, status")
    .eq("period_month", period);
  if (error) throw new Error(error.message);

  const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const row of data ?? []) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return { period_month: period, total_submissions: data?.length ?? 0, by_status: counts };
}

async function helpTicketReport({ status }: { status?: string }) {
  const supabase = createAdminClient();
  let q = supabase.from("help_requests").select("status, assigned_team");
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const byStatus: Record<string, number> = {};
  const byTeam: Record<string, number> = {};
  for (const row of data ?? []) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    byTeam[row.assigned_team] = (byTeam[row.assigned_team] ?? 0) + 1;
  }
  return { total: data?.length ?? 0, by_status: byStatus, by_assigned_team: byTeam };
}

async function employeeList({ sbu }: { sbu?: string }) {
  const supabase = createAdminClient();
  let q = supabase.from("employees").select("enroll_number, name, sbu, department, email");
  if (sbu) q = q.eq("sbu", sbu);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

// Not raw SQL — goes through PostgREST via .from(table), so there's no SQL
// injection surface here. Table name just has to resolve to something
// service_role was granted SELECT on; auth.* (login/session data) is a
// different schema entirely and was never granted, so it's unreachable no
// matter what table name is passed.
async function queryTable({ table, columns, filters, limit }: { table: string; columns?: string; filters?: Record<string, unknown>; limit?: number }) {
  if (!table || !/^[a-z_][a-z0-9_]*$/.test(table)) throw new Error("Invalid table name");
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table name is dynamic/user-chosen, not one of the typed Database tables
  let q = (supabase.from as any)(table).select(columns || "*").limit(Math.min(limit || 50, 500));
  if (filters) {
    for (const [key, value] of Object.entries(filters)) q = q.eq(key, value as string);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

const HANDLERS: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
  onboarding_progress_report: onboardingProgressReport,
  sales_onboarding_report: salesOnboardingReport as (args: Record<string, unknown>) => Promise<unknown>,
  employee_kpi_report: employeeKpiReport,
  help_ticket_report: helpTicketReport,
  employee_list: employeeList,
  query_table: queryTable as (args: Record<string, unknown>) => Promise<unknown>,
};

function rpcResult(id: unknown, result: unknown) {
  return Response.json({ jsonrpc: "2.0", id, result });
}
function rpcError(id: unknown, code: number, message: string) {
  return Response.json({ jsonrpc: "2.0", id, error: { code, message } }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const queryToken = new URL(req.url).searchParams.get("token");
  const ok = auth === `Bearer ${process.env.MCP_TOKEN}` || queryToken === process.env.MCP_TOKEN;
  if (!ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { id, method, params } = body;

  if (method === "initialize") {
    return rpcResult(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "onboardingbuddy-mcp", version: "1.0.0" },
    });
  }
  if (method === "tools/list") {
    return rpcResult(id, { tools: TOOLS });
  }
  if (method === "tools/call") {
    const fn = HANDLERS[params?.name];
    if (!fn) return rpcError(id, -32602, `Unknown tool: ${params?.name}`);
    try {
      const result = await fn(params?.arguments ?? {});
      return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
    } catch (e) {
      return rpcError(id, -32000, e instanceof Error ? e.message : "Tool failed");
    }
  }
  if (method === "notifications/initialized") {
    return new Response(null, { status: 202 });
  }

  return rpcError(id, -32601, `Unknown method: ${method}`);
}
