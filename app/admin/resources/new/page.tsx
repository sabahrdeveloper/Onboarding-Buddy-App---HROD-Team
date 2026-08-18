import { ResourceLinkForm } from "@/components/admin/ResourceLinkForm";
import { createResourceLink } from "@/actions/admin-resources";

export default function NewResourceLinkPage() {
  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">New Resource</div>
      <ResourceLinkForm action={createResourceLink} submitLabel="Create Resource" />
    </div>
  );
}
