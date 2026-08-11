import { createAdminClient } from "@/lib/supabase/admin";

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

  const { data: statuses, error: statusError } = await supabase.from("employee_task_status").select("employee_enroll_number, done");
  if (statusError) throw new Error(statusError.message);
  const doneCount = new Map<string, number>();
  const totalCount = new Map<string, number>();
  for (const s of statuses ?? []) {
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
