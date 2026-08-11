import { createAdminClient } from "@/lib/supabase/admin";

const TIMESTAMP = new Date().toISOString();

function ok(data: unknown) {
  return Response.json({ success: true, data, timestamp: TIMESTAMP });
}

function fail(reason: string, status = 401) {
  return Response.json({ success: false, error: reason, timestamp: TIMESTAMP }, { status });
}

export async function GET(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  const token = req.headers.get("token");

  if (!apiKey || !token) {
    return fail("Missing x-api-key or token header.");
  }

  if (
    apiKey !== process.env.PEOPLEDESK_API_KEY ||
    token !== process.env.PEOPLEDESK_API_TOKEN
  ) {
    return fail("Invalid credentials.");
  }

  const url = new URL(req.url);
  const daysParam = url.searchParams.get("days");
  const onlyNotEmailed = url.searchParams.get("unemailed") === "true";

  const supabase = createAdminClient();
  let q = supabase
    .from("employees")
    .select("enroll_number, name, email, sbu, department, designation, joining_date");

  if (daysParam) {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(daysParam, 10));
    q = q.gte("joining_date", since.toISOString().slice(0, 10));
  }

  const { data, error } = await q.order("joining_date", { ascending: false });

  if (error) {
    return fail("Database error: " + error.message, 500);
  }

  let result = data ?? [];

  if (onlyNotEmailed && url.searchParams.get("exclude_ids")) {
    const excludeIds = url.searchParams.get("exclude_ids")!.split(",");
    result = result.filter((e) => !excludeIds.includes(e.enroll_number));
  }

  return ok(result);
}
