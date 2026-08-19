import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JourneyForm } from "@/components/admin/JourneyForm";
import { updateJourney } from "@/actions/admin-journeys";

export default async function EditJourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("admin_variant_id").eq("id", user.id).single();
  if (!profile?.admin_variant_id) redirect("/home");

  const { data: journey } = await supabase
    .from("onboarding_phases")
    .select("*")
    .eq("id", id)
    .eq("variant_id", profile.admin_variant_id)
    .single();
  if (!journey) notFound();

  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">Rename Journey</div>
      <JourneyForm action={updateJourney.bind(null, id)} initial={journey} submitLabel="Save Changes" />
    </div>
  );
}
