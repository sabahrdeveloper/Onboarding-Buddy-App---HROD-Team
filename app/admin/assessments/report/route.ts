import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAssessmentReportWorkbook } from "@/lib/assessment-report";

export async function GET(request: NextRequest) {
  const journeyId = request.nextUrl.searchParams.get("journeyId");
  if (!journeyId) return NextResponse.json({ error: "journeyId is required." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { data: journey } = await supabase.from("onboarding_phases").select("name, variant_id").eq("id", journeyId).single();
  if (!journey || journey.variant_id !== profile.admin_variant_id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const buffer = await buildAssessmentReportWorkbook(journeyId);
  const filename = `${journey.name.replace(/[^a-z0-9]+/gi, "_")}_assessment_report.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
