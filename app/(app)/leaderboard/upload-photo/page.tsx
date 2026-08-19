import { redirect } from "next/navigation";
import { getEmployee, getEmployeeVariant } from "@/lib/data/queries";
import { getLeaderboard } from "@/lib/leaderboard";
import { PhotoUploadForm } from "@/components/leaderboard/PhotoUploadForm";

export default async function UploadLeaderboardPhotoPage() {
  const variant = await getEmployeeVariant();
  if (variant.isDefault) redirect("/journey");
  const isBn = variant.navMode === "resources";

  const { data: employee } = await getEmployee();
  const entries = await getLeaderboard(variant.id);
  const myEntry = employee ? entries.find((e) => e.enrollNumber === employee.enroll_number) : undefined;

  if (!myEntry || myEntry.rank > 3) {
    return (
      <div className="mt-8 rounded-card border border-line bg-card p-4 text-center text-sm font-medium text-muted shadow-card">
        {isBn ? "আপনি বর্তমানে লিডারবোর্ডের টপ ৩-এ নেই।" : "You're not currently in the leaderboard's top 3."}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 mt-1.5 text-center font-en text-lg font-extrabold text-text">
        {isBn ? `অভিনন্দন! আপনি #${myEntry.rank}` : `Congratulations! You're #${myEntry.rank}`}
      </div>
      <div className="mb-5 text-center text-sm font-medium text-muted">
        {isBn ? "পডিয়ামের জন্য আপনার একটি ছবি আপলোড করুন।" : "Upload a photo for the podium."}
      </div>
      <PhotoUploadForm bn={isBn} />
    </div>
  );
}
