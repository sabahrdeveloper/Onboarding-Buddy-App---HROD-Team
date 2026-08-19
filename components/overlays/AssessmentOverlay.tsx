"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Mascot } from "@/components/mascot/Mascot";
import { OverlayShell } from "@/components/overlays/OverlayShell";
import { bn } from "@/lib/bn";
import type { AssessmentTemplate, MilestoneAssessmentTemplate, MilestoneIdentity } from "@/lib/types";

const RATING_LABELS = ["1 · Strongly Disagree", "2 · Somewhat Disagree", "3 · Agree", "4 · Strongly Agree"];
const RATING_LABELS_BN = ["১ · একদমই একমত না", "২ · কিছুটা একমত না", "৩ · একমত", "৪ · সম্পূর্ণ একমত"];
const RATING_ON_CLASSES = [
  "border-[#f1b4b6] bg-err-bg text-err-tx",
  "border-[#f0d08a] bg-warn-bg text-warn-tx",
  "border-[#b9d0fa] bg-info-bg text-info-tx",
  "border-[#a9ddb8] bg-ok-bg text-ok-tx",
];

export interface AssessmentSubmitPayload {
  ratings: Record<string, number>;
  comment: string;
  milestoneIdentity?: MilestoneIdentity;
  milestoneResponses?: Record<string, "yes" | "no">;
}

interface AssessmentOverlayProps {
  template: AssessmentTemplate;
  milestoneTemplate?: MilestoneAssessmentTemplate;
  identityDefaults: MilestoneIdentity;
  onBack: () => void;
  onSubmit: (payload: AssessmentSubmitPayload) => void;
  pending: boolean;
  bn?: boolean;
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <span className="font-en text-[13px] font-bold text-text">{value || "—"}</span>
    </div>
  );
}

export function AssessmentOverlay({
  template,
  milestoneTemplate,
  identityDefaults,
  onBack,
  onSubmit,
  pending,
  bn: isBn,
}: AssessmentOverlayProps) {
  const ratingLabels = isBn ? RATING_LABELS_BN : RATING_LABELS;
  const [tab, setTab] = useState<"rating" | "assessment">(milestoneTemplate ? "assessment" : "rating");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [team, setTeam] = useState(identityDefaults.team);
  const [section, setSection] = useState(identityDefaults.section);
  const [responses, setResponses] = useState<Record<string, "yes" | "no">>({});

  const ratingComplete = Object.keys(ratings).length === template.items.length;
  const assessmentComplete =
    !milestoneTemplate ||
    (team.trim() !== "" && section.trim() !== "" && milestoneTemplate.questions.every((q) => responses[q]));
  const canSubmit = ratingComplete && assessmentComplete;

  function handleSubmit() {
    onSubmit({
      ratings,
      comment,
      milestoneIdentity: milestoneTemplate ? { ...identityDefaults, team, section } : undefined,
      milestoneResponses: milestoneTemplate ? responses : undefined,
    });
  }

  return (
    <OverlayShell
      title={template.title}
      subtitle={isBn ? "দায়িত্বে: HR / Manager" : "Responsible: HR / Manager"}
      onBack={onBack}
      footer={
        <button
          onClick={handleSubmit}
          disabled={pending || !canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-button bg-green px-4 py-4 font-en text-base font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {isBn ? "জমা দিন" : "Submit"}
        </button>
      }
    >
      {milestoneTemplate && (
        <div className="mb-4 flex gap-1.5 rounded-2xl bg-[#edeff2] p-1">
          <button
            onClick={() => setTab("assessment")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 font-en text-[13px] font-bold transition-colors ${
              tab === "assessment" ? "bg-card text-text shadow-card" : "text-muted"
            }`}
          >
            {milestoneTemplate && assessmentComplete && <Icon name="checkCircle" size={14} className="text-green-dark" />}
            {isBn ? "অ্যাসেসমেন্ট" : "Assessment"}
          </button>
          <button
            onClick={() => setTab("rating")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 font-en text-[13px] font-bold transition-colors ${
              tab === "rating" ? "bg-card text-text shadow-card" : "text-muted"
            }`}
          >
            {ratingComplete && <Icon name="checkCircle" size={14} className="text-green-dark" />}
            {isBn ? "রেটিং" : "Rating"}
          </button>
        </div>
      )}

      {tab === "assessment" && milestoneTemplate && (
        <>
          <div className="mb-3 mt-0.5 font-en text-xs font-bold uppercase tracking-[0.03em] text-muted">
            {isBn ? "পরিচিতি" : "Identity"}
          </div>
          <div className="mb-4 rounded-card border border-line bg-card px-4 shadow-card">
            <IdentityRow label={isBn ? "এমপ্লয়ি আইডি" : "Employee ID"} value={identityDefaults.employeeId} />
            <IdentityRow label={isBn ? "পুরো নাম" : "Full Name"} value={identityDefaults.fullName} />
            <IdentityRow label={isBn ? "কোম্পানি ইমেইল" : "Company Email"} value={identityDefaults.email} />
            <IdentityRow label={isBn ? "পদবী" : "Designation"} value={identityDefaults.designation} />
            <IdentityRow label="SBU" value={identityDefaults.sbu} />
          </div>
          <div className="mb-3.5">
            <label className="mb-1.5 block font-en text-[12.5px] font-bold text-text">Team</label>
            <input
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="আপনার Team লিখুন"
              className="w-full rounded-input border border-line bg-card px-3.5 py-3 font-en text-sm text-text outline-none placeholder:text-muted focus:border-green"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block font-en text-[12.5px] font-bold text-text">Section</label>
            <input
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="আপনার Section লিখুন"
              className="w-full rounded-input border border-line bg-card px-3.5 py-3 font-en text-sm text-text outline-none placeholder:text-muted focus:border-green"
            />
          </div>

          <div className="mb-3 font-en text-xs font-bold uppercase tracking-[0.03em] text-muted">
            {isBn ? "রিভিউ প্রশ্ন" : "Review Questions"}
          </div>
          {milestoneTemplate.questions.map((q, i) => (
            <div key={q} className="mb-[11px] rounded-[14px] border border-line bg-card p-3.5 shadow-card">
              <div className="mb-2.5 font-en text-[13.5px] font-semibold leading-snug text-text">
                {bn(i + 1)}. {q}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setResponses((r) => ({ ...r, [q]: "yes" }))}
                  className={`flex-1 rounded-xl border py-2.5 font-en text-[13px] font-bold ${
                    responses[q] === "yes" ? "border-green bg-green-light text-green-dark" : "border-line bg-bg text-muted"
                  }`}
                >
                  {isBn ? "হ্যাঁ" : "Yes"}
                </button>
                <button
                  onClick={() => setResponses((r) => ({ ...r, [q]: "no" }))}
                  className={`flex-1 rounded-xl border py-2.5 font-en text-[13px] font-bold ${
                    responses[q] === "no" ? "border-[#f1b4b6] bg-err-bg text-err-tx" : "border-line bg-bg text-muted"
                  }`}
                >
                  {isBn ? "না" : "No"}
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "rating" && (
        <>
          <div className="mb-4 mt-0.5 flex items-start gap-3">
            <div className="h-[50px] w-[50px] shrink-0">
              <Mascot variant="color" mood="thinking" />
            </div>
            <div className="rounded-[4px_16px_16px_16px] border border-line bg-card px-[15px] py-[13px] shadow-card">
              <div className="font-en text-[14.5px] font-semibold leading-[1.45] text-text">
                প্রতিটি বিষয়ে rating দিন। আপনার অভিজ্ঞতা আমাদের কাছে গুরুত্বপূর্ণ।
              </div>
            </div>
          </div>

          <div className="mb-3 mt-2 font-en text-xs font-bold uppercase tracking-[0.03em] text-muted">
            {isBn ? "আপনার অভিজ্ঞতা" : "Your Experience"}
          </div>
          {template.items.map((item, i) => (
            <div key={item} className="mb-[11px] rounded-[14px] border border-line bg-card p-3.5 shadow-card">
              <div className="mb-2.5 font-en text-[13.5px] font-semibold text-text">
                {bn(i + 1)}. {item}
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRatings((r) => ({ ...r, [item]: n }))}
                    className={`flex-1 rounded-[10px] border px-0.5 py-2 font-en text-[10px] font-bold leading-[1.15] ${
                      ratings[item] === n ? RATING_ON_CLASSES[n - 1] : "border-line bg-bg text-muted"
                    }`}
                  >
                    {ratingLabels[n - 1]}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mb-3.5">
            <label className="mb-1.5 block font-en text-[12.5px] font-bold text-text">
              {isBn ? "আপনার মন্তব্য" : "Your Comment"}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="আপনার মন্তব্য…"
              className="min-h-[66px] w-full resize-y rounded-input border border-line bg-card px-3.5 py-3 font-en text-sm text-text outline-none placeholder:text-muted focus:border-green"
            />
          </div>
        </>
      )}
    </OverlayShell>
  );
}
