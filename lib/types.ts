// Default (Akij Resource) variant: exactly "30"|"60"|"90". Any non-default
// variant (dynamic journeys, see onboarding_phases) stores an arbitrary
// onboarding_phases.id here instead — loosened to plain string so both
// fit the same column/type without a parallel Task shape.
export type PhaseKey = string;
export type AssessmentKey = "30" | "60" | "90" | "180";

export interface JourneyPhase {
  key: PhaseKey;
  title: string;
  sub: string;
  color: string;
  short: string;
  totalTasks: number;
  doneTasks: number;
}

export interface GrowthPhase {
  key: "180";
  title: string;
  sub: string;
  reviewItemCount: number;
  unlocked: boolean;
}

export const PHASE_META: Record<PhaseKey, { title: string; sub: string; color: string; short: string }> = {
  "30": { title: "30 Days Journey", sub: "Joining → First Check (Work 1-22)", color: "#2CA24D", short: "30D" },
  "60": { title: "60 Days Journey", sub: "Contribution & Collaboration (Work 23-39)", color: "#2CA24D", short: "60D" },
  "90": { title: "90 Days Journey", sub: "Confirmation & Review (Work 40-50)", color: "#2CA24D", short: "90D" },
};

export const GROWTH_PHASE_META = {
  title: "180 Days Growth",
  sub: "Growth & Integration Review",
  reviewItemCount: 10,
};

// Bangla variants — used only when the employee's current effective variant
// is the Sales Onboarding one (navMode === 'resources'); the Organization
// Onboarding track (even for a Light Engineering employee) stays English,
// same as every other variant.
export const PHASE_META_BN: Record<PhaseKey, { title: string; sub: string; color: string; short: string }> = {
  "30": { title: "৩০ দিনের জার্নি", sub: "জয়েনিং → প্রথম চেক (Work ১-২২)", color: "#2CA24D", short: "৩০দি" },
  "60": { title: "৬০ দিনের জার্নি", sub: "কন্ট্রিবিউশন ও সহযোগিতা (Work ২৩-৩৯)", color: "#2CA24D", short: "৬০দি" },
  "90": { title: "৯০ দিনের জার্নি", sub: "কনফার্মেশন ও রিভিউ (Work ৪০-৫০)", color: "#2CA24D", short: "৯০দি" },
};

export const GROWTH_PHASE_META_BN = {
  title: "১৮০ দিনের গ্রোথ",
  sub: "গ্রোথ ও ইন্টিগ্রেশন রিভিউ",
  reviewItemCount: 10,
};

export interface Task {
  id: string;
  workNumber: number;
  phase: PhaseKey;
  title: string;
  responsibleRole: string;
  responsibleKey: string;
  /** All assignee contact keys (multi-owner tasks, e.g. HRBP + IT). */
  responsibleKeys: string[];
  timeline: string;
  whyText: string;
  howToSteps: string[];
  confirmQuestion: string;
  done: boolean;
  doneDate: string | null;
}

export interface Contact {
  key: string;
  name: string;
  role: string;
  phone: string;
  icon: string;
  email?: string | null;
}

export interface AssessmentTemplate {
  key: AssessmentKey;
  title: string;
  items: string[];
  statusOptions: string[];
}

export interface EmployeeAssessment {
  assessmentKey: AssessmentKey;
  ratings: Record<string, number>;
  comment: string | null;
  submittedAt: string | null;
}

export interface Badge {
  key: string;
  icon: string;
  name: string;
}

export interface KbEntry {
  keywords: string[];
  response: string;
}

export interface Employee {
  enrollNumber: string;
  name: string;
  sbu: string | null;
  department: string | null;
  designation: string | null;
  joiningDate: string | null;
  reportingManager: string | null;
  reportingManagerPhone: string | null;
  reportingManagerEmail: string | null;
  buddy: string | null;
  buddyPhone: string | null;
  buddyEmail: string | null;
  team: string | null;
  section: string | null;
  email: string | null;
}

export interface SbuOption {
  id: string;
  name: string;
  sortOrder: number;
}

export interface MilestoneAssessmentTemplate {
  milestone: PhaseKey;
  questions: string[];
}

export interface MilestoneIdentity {
  employeeId: string;
  fullName: string;
  email: string;
  designation: string;
  team: string;
  section: string;
  sbu: string;
}

export interface MilestoneAssessment {
  milestone: PhaseKey;
  identity: MilestoneIdentity;
  responses: Record<string, "yes" | "no">;
  submittedAt: string | null;
}
