"use client";

import { createContext, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IconName } from "@/components/icons/Icon";
import { FullTaskListOverlay } from "@/components/overlays/FullTaskListOverlay";
import { PhaseViewOverlay } from "@/components/overlays/PhaseViewOverlay";
import { TaskManualOverlay } from "@/components/overlays/TaskManualOverlay";
import { AssessmentOverlay, type AssessmentSubmitPayload } from "@/components/overlays/AssessmentOverlay";
import { GrowthReviewOverlay } from "@/components/overlays/GrowthReviewOverlay";
import { HelpRequestOverlay } from "@/components/overlays/HelpRequestOverlay";
import { ContactSheet } from "@/components/overlays/ContactSheet";
import { ContactListSheet } from "@/components/overlays/ContactListSheet";
import type { ContactListEntry } from "@/lib/contact-lists";
import { toWhatsAppNumber, type ContactActionInfo } from "@/lib/contact-actions";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { SuccessModal, type SuccessModalState } from "@/components/ui/SuccessModal";
import { markTaskDone } from "@/actions/tasks";
import { submitAssessment } from "@/actions/assessments";
import { submitMilestoneAssessment } from "@/actions/milestone-assessments";
import { submitHelpRequest } from "@/actions/help";
import { growthReviewUnlocked } from "@/lib/business-rules";
import type {
  AssessmentKey,
  AssessmentTemplate,
  Contact,
  MilestoneAssessmentTemplate,
  MilestoneIdentity,
  PhaseKey,
  Task,
} from "@/lib/types";

type OverlayEntry =
  | { type: "list" }
  | { type: "phase"; phaseKey: PhaseKey }
  | { type: "task"; taskId: string }
  | { type: "assessment"; key: AssessmentKey }
  | { type: "growth" }
  | { type: "help"; relatedTaskId?: string }
  | { type: "contact"; contactKey: string }
  | { type: "contactList"; category: "hr" | "it" };

interface OverlayContextValue {
  openList: () => void;
  openPhase: (key: PhaseKey) => void;
  openGrowth: () => void;
  openHelp: (relatedTaskId?: string) => void;
  openContact: (contactKey: string) => void;
  notify: (text: string, icon?: IconName) => void;
  taskCount: number;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within OverlayProvider");
  return ctx;
}

interface AssessmentSubmission {
  assessmentKey: AssessmentKey;
  submittedAt: string | null;
}

interface OverlayProviderProps {
  tasks: Task[];
  contacts: Contact[];
  assessmentTemplates: AssessmentTemplate[];
  submittedAssessments: AssessmentSubmission[];
  milestoneAssessmentTemplates: MilestoneAssessmentTemplate[];
  submittedMilestoneKeys: Set<PhaseKey>;
  identityDefaults: MilestoneIdentity;
  hrContactList: ContactListEntry[];
  itContactList: ContactListEntry[];
  helpIssueTypes: string[];
  children: React.ReactNode;
}

export function OverlayProvider({
  tasks: initialTasks,
  contacts,
  assessmentTemplates,
  submittedAssessments,
  milestoneAssessmentTemplates,
  submittedMilestoneKeys,
  identityDefaults,
  hrContactList,
  itContactList,
  helpIssueTypes,
  children,
}: OverlayProviderProps) {
  const router = useRouter();
  const [stack, setStack] = useState<OverlayEntry[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [successModal, setSuccessModal] = useState<SuccessModalState | null>(null);
  const [pending, setPending] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Held as local state (not just the prop directly) so marking a task done
  // can update the UI instantly, before the server round-trip that follows
  // resolves — the eventual background refresh syncs this back to the
  // server's copy once it lands, so this never drifts for long. Resetting
  // during render (rather than in an effect) on prop change avoids an extra
  // render pass — see https://react.dev/learn/you-might-not-need-an-effect.
  const [tasksProp, setTasksProp] = useState(initialTasks);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  if (initialTasks !== tasksProp) {
    setTasksProp(initialTasks);
    setTasks(initialTasks);
  }

  function showToast(text: string, icon?: IconName) {
    setToast({ text, icon });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function push(entry: OverlayEntry) {
    setStack((s) => [...s, entry]);
  }
  function pop() {
    setStack((s) => s.slice(0, -1));
  }
  function closeAll() {
    setStack([]);
  }

  const contactByKey = new Map(contacts.map((c) => [c.key, c]));
  const templateByKey = new Map(assessmentTemplates.map((t) => [t.key, t]));
  const submittedByKey = new Map(submittedAssessments.map((s) => [s.assessmentKey, s]));
  const milestoneTemplateByKey = new Map(milestoneAssessmentTemplates.map((t) => [t.milestone, t]));

  const completedCount = tasks.filter((t) => t.done).length;
  const allTasksDone = tasks.length > 0 && completedCount === tasks.length;
  // BRU-09, extended by item 6: 30/60/90 must have both the rating assessment
  // AND the new mandatory milestone questions submitted before Growth unlocks.
  const phaseFullySubmitted = (phase: PhaseKey) =>
    Boolean(submittedByKey.get(phase)?.submittedAt) && submittedMilestoneKeys.has(phase);
  const growthUnlocked = growthReviewUnlocked(allTasksDone, {
    "30": phaseFullySubmitted("30"),
    "60": phaseFullySubmitted("60"),
    "90": phaseFullySubmitted("90"),
  });

  async function handleMarkDone(taskId: string) {
    // Optimistic: reflect "done" and close the overlay immediately, rather
    // than making the user wait on the server round-trip (that round-trip
    // was the actual multi-second delay users were feeling — the mutation
    // itself is fast, but router.refresh() re-fetching the whole page tree
    // afterward is not). Roll back only if the action turns out to have failed.
    const previousTasks = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: true, doneDate: new Date().toISOString() } : t)),
    );
    showToast("কাজটি সম্পন্ন হিসেবে চিহ্নিত হয়েছে", "check");
    pop();

    const result = await markTaskDone(taskId);
    if (result.error) {
      setTasks(previousTasks);
      showToast(result.error);
      return;
    }

    // Sync Next's server-side cache in the background — not awaited, doesn't
    // block anything the user is looking at.
    router.refresh();

    if (result.phaseComplete && result.phaseTitle) {
      setSuccessModal({
        title: "Phase Complete",
        message: `"${result.phaseTitle}" সম্পন্ন হয়েছে। আপনি ১৮০ দিনের পথচলায় দুর্দান্ত এগিয়ে যাচ্ছেন।`,
      });
    }
  }

  async function handleSubmitAssessment(key: AssessmentKey, payload: AssessmentSubmitPayload) {
    const template = templateByKey.get(key);
    if (Object.keys(payload.ratings).length < (template?.items.length ?? 0)) {
      showToast("সব বিষয়ে rating দিন", "info");
      return;
    }
    const milestoneTemplate = key !== "180" ? milestoneTemplateByKey.get(key as PhaseKey) : undefined;
    if (milestoneTemplate) {
      if (!payload.milestoneIdentity?.team.trim() || !payload.milestoneIdentity?.section.trim()) {
        showToast("Team ও Section পূরণ করুন", "info");
        return;
      }
      const allAnswered = milestoneTemplate.questions.every((q) => payload.milestoneResponses?.[q]);
      if (!allAnswered) {
        showToast("Assessment ট্যাবের সব প্রশ্নের উত্তর দিন", "info");
        return;
      }
    }

    setPending(true);
    // These write to unrelated tables — run them concurrently instead of
    // waiting on the rating submission before starting the milestone one.
    const [result, milestoneResult] = await Promise.all([
      submitAssessment({
        assessmentKey: key,
        ratings: payload.ratings,
        comment: payload.comment,
      }),
      milestoneTemplate && payload.milestoneIdentity && payload.milestoneResponses
        ? submitMilestoneAssessment({
            milestone: key as PhaseKey,
            identity: payload.milestoneIdentity,
            responses: payload.milestoneResponses,
          })
        : Promise.resolve(undefined),
    ]);
    if (result.error) {
      setPending(false);
      showToast(result.error);
      return;
    }
    if (milestoneResult?.error) {
      setPending(false);
      showToast(milestoneResult.error);
      return;
    }

    setPending(false);
    pop();
    router.refresh();
    const title = template?.title ?? "Assessment";
    if (key === "180") {
      setSuccessModal({
        title: "Growth Review Submitted",
        message: `180 Days Growth Review সফলভাবে জমা হয়েছে। HR ও Manager রিভিউ করবে।`,
      });
    } else {
      setSuccessModal({
        title: "Assessment Submitted",
        message: `${title} সফলভাবে জমা হয়েছে। HR team রিভিউ করবে।`,
      });
    }
  }

  async function handleSubmitHelp(
    relatedTaskId: string | undefined,
    payload: { issueType: string; description: string; phone: string },
  ) {
    if (!payload.description.trim()) {
      showToast("সমস্যাটি বর্ণনা করুন", "info");
      return;
    }
    setPending(true);
    const result = await submitHelpRequest({ ...payload, relatedTaskId: relatedTaskId ?? null });
    setPending(false);
    if (result.error) {
      showToast(result.error);
      return;
    }
    pop();
    setSuccessModal({
      title: "Help Request Sent",
      message: "ধন্যবাদ। আপনার onboarding support request HR team-এর কাছে পাঠানো হয়েছে।",
      ticket: { ticketId: result.ticketId!, status: "Pending", assignedTo: "HR Onboarding Team" },
      secondaryLabel: "Close",
    });
  }

  function handleContactAction(type: "call" | "whatsapp" | "message", info: ContactActionInfo) {
    if ((type === "call" || type === "whatsapp") && !info.phone) {
      showToast(`${info.name}-এর ফোন নম্বর পাওয়া যায়নি`, "info");
      return;
    }
    if (type === "message" && !info.email) {
      showToast(`${info.name}-এর ইমেইল পাওয়া যায়নি`, "info");
      return;
    }
    if (type === "call") {
      window.location.href = `tel:${info.phone}`;
    } else if (type === "whatsapp") {
      window.open(`https://wa.me/${toWhatsAppNumber(info.phone!)}`, "_blank");
    } else {
      window.location.href = `mailto:${info.email}`;
    }
  }

  const current = stack[stack.length - 1];
  const currentTask = current?.type === "task" ? tasks.find((t) => t.id === current.taskId) : undefined;
  const currentTemplate = current?.type === "assessment" ? templateByKey.get(current.key) : undefined;
  const currentMilestoneTemplate =
    current?.type === "assessment" && current.key !== "180" ? milestoneTemplateByKey.get(current.key as PhaseKey) : undefined;
  const currentContact = current?.type === "contact" ? contactByKey.get(current.contactKey) : undefined;
  const helpRelatedTaskId = current?.type === "help" ? current.relatedTaskId : undefined;
  const helpRelatedTask = helpRelatedTaskId ? tasks.find((t) => t.id === helpRelatedTaskId) : undefined;

  return (
    <OverlayContext.Provider
      value={{
        openList: () => push({ type: "list" }),
        openPhase: (key) => push({ type: "phase", phaseKey: key }),
        openGrowth: () => push({ type: "growth" }),
        openHelp: (relatedTaskId) => push({ type: "help", relatedTaskId }),
        openContact: (contactKey) => push({ type: "contact", contactKey }),
        notify: showToast,
        taskCount: tasks.length,
      }}
    >
      {children}

      {current?.type === "list" && (
        <FullTaskListOverlay
          tasks={tasks}
          contacts={contacts}
          onBack={pop}
          onOpenTask={(id) => push({ type: "task", taskId: id })}
        />
      )}

      {current?.type === "phase" && (
        <PhaseViewOverlay
          phaseKey={current.phaseKey}
          tasks={tasks}
          contacts={contacts}
          submitted={phaseFullySubmitted(current.phaseKey)}
          onBack={pop}
          onOpenTask={(id) => push({ type: "task", taskId: id })}
          onOpenAssessment={(key) => push({ type: "assessment", key })}
        />
      )}

      {currentTask && (
        <TaskManualOverlay
          task={currentTask}
          contacts={currentTask.responsibleKeys
            .map((k) => contactByKey.get(k))
            .filter((c): c is Contact => Boolean(c))}
          onBack={pop}
          onMarkDone={() => handleMarkDone(currentTask.id)}
          onNeedHelp={() => push({ type: "help", relatedTaskId: currentTask.id })}
          onContactAction={handleContactAction}
          pending={pending}
        />
      )}

      {currentTemplate && (
        <AssessmentOverlay
          template={currentTemplate}
          milestoneTemplate={currentMilestoneTemplate}
          identityDefaults={identityDefaults}
          onBack={pop}
          onSubmit={(payload) => handleSubmitAssessment(currentTemplate.key, payload)}
          pending={pending}
        />
      )}

      {current?.type === "growth" && (
        <GrowthReviewOverlay
          unlocked={growthUnlocked}
          completedCount={completedCount}
          reviewItems={templateByKey.get("180")?.items ?? []}
          onBack={pop}
          onStartReview={() => push({ type: "assessment", key: "180" })}
          onContact={(key) => push({ type: "contact", contactKey: key })}
        />
      )}

      {current?.type === "help" && (
        <HelpRequestOverlay
          issueTypes={helpIssueTypes}
          relatedTaskTitle={helpRelatedTask?.title}
          onBack={pop}
          onSubmit={(payload) => handleSubmitHelp(helpRelatedTaskId, payload)}
          pending={pending}
        />
      )}

      {currentContact && (
        <ContactSheet
          contact={currentContact}
          onClose={pop}
          onContactAction={handleContactAction}
          onRequestHelp={() => {
            pop();
            push({ type: "help" });
          }}
          onViewContactList={
            currentContact.key === "hr" || currentContact.key === "it"
              ? () => push({ type: "contactList", category: currentContact.key as "hr" | "it" })
              : undefined
          }
        />
      )}

      {current?.type === "contactList" && (
        <ContactListSheet
          title={current.category === "hr" ? "HR Contact List" : "IT Contact List"}
          entries={current.category === "hr" ? hrContactList : itContactList}
          onClose={pop}
          onContactAction={handleContactAction}
        />
      )}

      {successModal && (
        <SuccessModal
          title={successModal.title}
          message={successModal.message}
          ticket={successModal.ticket}
          secondaryLabel={successModal.secondaryLabel}
          onHome={() => {
            setSuccessModal(null);
            closeAll();
            router.push("/home");
          }}
          onViewJourney={() => {
            setSuccessModal(null);
            closeAll();
            router.push("/journey");
          }}
        />
      )}

      <Toast toast={toast} />
    </OverlayContext.Provider>
  );
}
