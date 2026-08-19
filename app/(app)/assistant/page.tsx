import { redirect } from "next/navigation";
import { ChatClient } from "@/components/assistant/ChatClient";
import { getAdminVariantId, getEmployeeVariant } from "@/lib/data/queries";

export default async function AssistantPage() {
  // AI Assistant is not part of a variant-scoped HR admin's experience —
  // their nav has no tab pointing here either, see BottomNav's
  // showEmployeesTab.
  const adminVariantId = await getAdminVariantId();
  if (adminVariantId) redirect("/employees");

  const variant = await getEmployeeVariant();
  return <ChatClient bn={variant.navMode === "resources"} />;
}
