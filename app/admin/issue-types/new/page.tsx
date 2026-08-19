import { IssueTypeForm } from "@/components/admin/IssueTypeForm";
import { createIssueType } from "@/actions/admin-issue-types";

export default function NewIssueTypePage() {
  return (
    <div>
      <div className="mb-3 font-en text-[15px] font-bold text-text">New Issue Type</div>
      <IssueTypeForm action={createIssueType} submitLabel="Create Issue Type" />
    </div>
  );
}
