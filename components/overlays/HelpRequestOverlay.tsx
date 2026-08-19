"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Mascot } from "@/components/mascot/Mascot";
import { OverlayShell } from "@/components/overlays/OverlayShell";

interface HelpRequestOverlayProps {
  issueTypes: string[];
  relatedTaskTitle?: string;
  onBack: () => void;
  onSubmit: (payload: { issueType: string; description: string; phone: string }) => void;
  pending: boolean;
}

export function HelpRequestOverlay({ issueTypes, relatedTaskTitle, onBack, onSubmit, pending }: HelpRequestOverlayProps) {
  const [issueType, setIssueType] = useState(issueTypes[0] ?? "");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [attached, setAttached] = useState(false);

  return (
    <OverlayShell
      title="Request Help"
      onBack={onBack}
      footer={
        <button
          onClick={() => onSubmit({ issueType, description, phone })}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-button bg-green px-4 py-4 font-en text-base font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          Send to HR Team
          <Icon name="arrowRight" size={18} />
        </button>
      }
    >
      <div className="mb-4 mt-0.5 flex items-start gap-3">
        <div className="h-[50px] w-[50px] shrink-0">
          <Mascot variant="color" mood="happy" />
        </div>
        <div className="rounded-[4px_16px_16px_16px] border border-line bg-card px-[15px] py-[13px] shadow-card">
          <div className="font-en text-[14.5px] font-semibold leading-[1.45] text-text">
            সমস্যা হচ্ছে? নিচের তথ্য দিন, HR team দ্রুত সাহায্য করবে।
          </div>
        </div>
      </div>

      <div className="mb-3.5">
        <label className="mb-1.5 block font-en text-[12.5px] font-bold text-text">Issue Type</label>
        <select
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
          className="w-full rounded-input border border-line bg-card px-3.5 py-3 font-en text-sm text-text outline-none focus:border-green"
        >
          {issueTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {relatedTaskTitle && (
        <div className="mb-3.5">
          <label className="mb-1.5 block font-en text-[12.5px] font-bold text-text">Related Task</label>
          <input
            readOnly
            value={relatedTaskTitle}
            className="w-full rounded-input border border-line bg-bg px-3.5 py-3 font-en text-sm text-muted outline-none"
          />
        </div>
      )}

      <div className="mb-3.5">
        <label className="mb-1.5 block font-en text-[12.5px] font-bold text-text">Problem Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="বিস্তারিত লিখুন…"
          className="min-h-[66px] w-full resize-y rounded-input border border-line bg-card px-3.5 py-3 font-en text-sm text-text outline-none placeholder:text-muted focus:border-green"
        />
      </div>

      <div className="mb-3.5">
        <label className="mb-1.5 block font-en text-[12.5px] font-bold text-text">Preferred Contact Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+880 1XXX-XXXXXX"
          className="w-full rounded-input border border-line bg-card px-3.5 py-3 font-en text-sm text-text outline-none placeholder:text-muted focus:border-green"
        />
      </div>

      <div>
        <label className="mb-1.5 block font-en text-[12.5px] font-bold text-text">Upload Screenshot / Document</label>
        <div
          onClick={() => setAttached(true)}
          className={`cursor-pointer rounded-[14px] border-[1.5px] border-dashed p-[18px] text-center text-[13px] font-medium ${
            attached ? "border-green bg-green-light text-green-dark" : "border-[#bec5cf] bg-card text-muted"
          }`}
        >
          <div className="mb-2 flex justify-center">
            <Icon name="paperclip" size={24} />
          </div>
          <span>{attached ? "screenshot_2026.png" : "ট্যাপ করে সংযুক্ত করুন"}</span>
        </div>
      </div>
    </OverlayShell>
  );
}
