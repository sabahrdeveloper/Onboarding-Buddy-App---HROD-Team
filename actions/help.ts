"use server";

import { createClient } from "@/lib/supabase/server";

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

  // System Access issues are IT's — everything else (Policy, KPI/Role,
  // Buddy/Mentor, Training, Other) routes to HR, matching the ISSUE_TYPES
  // list in HelpRequestOverlay.
  const assignedTeam = input.issueType === "System Access" ? "it" : "hr";

  const { error } = await supabase.from("help_requests").insert({
    employee_enroll_number: profile.enroll_number,
    issue_type: input.issueType,
    related_task_id: input.relatedTaskId,
    description: input.description.trim(),
    phone: input.phone || null,
    ticket_id: ticketId,
    status: "open",
    assigned_team: assignedTeam,
  });

  if (error) return { error: "পাঠানো যায়নি। একটু পর আবার চেষ্টা করুন।" };

  return { ticketId };
}
