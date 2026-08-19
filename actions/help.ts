"use server";

import { createClient } from "@/lib/supabase/server";
import { getEmployeeVariant } from "@/lib/data/queries";

interface SubmitHelpRequestInput {
  issueType: string;
  relatedTaskId: string | null;
  description: string;
  phone: string;
}

interface SubmitHelpRequestResult {
  error?: string;
  ticketId?: string;
}

function generateTicketId(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `OB-${year}-${suffix}`;
}

export async function submitHelpRequest(input: SubmitHelpRequestInput): Promise<SubmitHelpRequestResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "লগইন করা নেই।" };

  const { data: profile } = await supabase.from("profiles").select("enroll_number").eq("id", user.id).single();
  if (!profile) return { error: "প্রোফাইল পাওয়া যায়নি।" };

  // BRU-10: problem description is required
  if (!input.description.trim()) {
    return { error: "সমস্যাটি বর্ণনা করুন।" };
  }

  const ticketId = generateTicketId();
  const variant = await getEmployeeVariant();

  // Routing (which team an issue type goes to) is now variant-configured
  // via help_issue_types (see the HR admin Issue Types screen) instead of a
  // hardcoded rule — falls back to "hr" only if the type was somehow
  // removed between the form loading and this submit.
  const { data: issueTypeRow } = await supabase
    .from("help_issue_types")
    .select("assigned_team")
    .eq("variant_id", variant.id)
    .eq("label", input.issueType)
    .maybeSingle();
  const assignedTeam = issueTypeRow?.assigned_team ?? "hr";

  const { error } = await supabase.from("help_requests").insert({
    employee_enroll_number: profile.enroll_number,
    issue_type: input.issueType,
    related_task_id: input.relatedTaskId,
    description: input.description.trim(),
    phone: input.phone || null,
    ticket_id: ticketId,
    status: "open",
    assigned_team: assignedTeam,
    variant_id: variant.id,
  });

  if (error) return { error: "পাঠানো যায়নি। একটু পর আবার চেষ্টা করুন।" };

  return { ticketId };
}
