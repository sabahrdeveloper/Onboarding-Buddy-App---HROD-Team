import { JourneyForm } from "@/components/admin/JourneyForm";
import { createJourney } from "@/actions/admin-journeys";

export default function NewJourneyPage() {
  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">New Journey</div>
      <JourneyForm action={createJourney} submitLabel="Create Journey" />
    </div>
  );
}
