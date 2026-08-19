"use client";

import { Icon } from "@/components/icons/Icon";
import { Mascot } from "@/components/mascot/Mascot";
import { OverlayShell } from "@/components/overlays/OverlayShell";
import { bn } from "@/lib/bn";

interface GrowthReviewOverlayProps {
  unlocked: boolean;
  completedCount: number;
  totalCount: number;
  reviewItems: string[];
  onBack: () => void;
  onStartReview: () => void;
  onContact: (key: "hr" | "manager") => void;
  bn?: boolean;
}

export function GrowthReviewOverlay({
  unlocked,
  completedCount,
  totalCount,
  reviewItems,
  onBack,
  onStartReview,
  onContact,
  bn: isBn,
}: GrowthReviewOverlayProps) {
  return (
    <OverlayShell
      title={isBn ? "১৮০ দিনের গ্রোথ রিভিউ" : "180 Days Growth Review"}
      subtitle="১৮০ দিনের গ্রোথ ও ইন্টিগ্রেশন রিভিউ"
      onBack={onBack}
      footer={
        <div>
          <button
            onClick={onStartReview}
            disabled={!unlocked}
            className="flex w-full items-center justify-center gap-2 rounded-button bg-green px-4 py-4 font-en text-base font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#9aa1ab] disabled:shadow-none"
          >
            {isBn ? "১৮০ দিনের রিভিউ শুরু করুন" : "Start 180 Days Review"}
            <Icon name="arrowRight" size={18} />
          </button>
          <div className="mt-2.5 flex gap-2.5">
            <button
              onClick={() => onContact("hr")}
              className="flex flex-1 items-center justify-center rounded-input border border-line bg-card py-3.5 font-en text-sm font-bold text-text shadow-card"
            >
              {isBn ? "HR-এর সাথে যোগাযোগ" : "Contact HR"}
            </button>
            <button
              onClick={() => onContact("manager")}
              className="flex flex-1 items-center justify-center rounded-input border border-line bg-card py-3.5 font-en text-sm font-bold text-text shadow-card"
            >
              {isBn ? "ম্যানেজারের সাথে যোগাযোগ" : "Contact Manager"}
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-4 mt-0.5 flex items-start gap-3">
        <div className="h-[50px] w-[50px] shrink-0">
          <Mascot variant="color" mood={unlocked ? "cheering" : "thinking"} />
        </div>
        <div className="rounded-[4px_16px_16px_16px] border border-line bg-card px-[15px] py-[13px] shadow-card">
          <div className="font-en text-[14.5px] font-semibold leading-[1.45] text-text">
            {unlocked
              ? "অভিনন্দন! ৯০ দিনের চেকলিস্ট সম্পন্ন। এবার আপনার ১৮০ দিনের গ্রোথ ও ইন্টিগ্রেশন রিভিউ।"
              : "এই রিভিউ ৯০ দিনের চেকলিস্ট সম্পন্ন হলে শুরু হবে। নিচে preview দেখুন।"}
          </div>
        </div>
      </div>

      {!unlocked && (
        <div className="mb-3.5 rounded-[14px] border border-[#cbddfb] bg-blue-light p-3.5 text-[13.5px] font-medium leading-[1.55] text-[#2f4e86]">
          <span className="mb-1.5 flex items-center gap-1.5 font-en text-[11px] font-bold uppercase tracking-[0.03em] opacity-85">
            <Icon name="lock" size={13} />
            {isBn ? "লকড" : "Locked"}
          </span>
          এখন পর্যন্ত {bn(completedCount)}/{bn(totalCount)} works সম্পন্ন। সব {bn(totalCount)}টি কাজ ও ৩টি assessment শেষ
          হলে 180 Days Review unlock হবে।
        </div>
      )}

      <div className="mb-3 mt-2 font-en text-xs font-bold uppercase tracking-[0.03em] text-muted">
        {isBn ? "গ্রোথ রিভিউ আইটেম" : "Growth Review Items"}
      </div>
      {reviewItems.map((item, i) => (
        <div
          key={item}
          className="mb-2.5 flex items-center gap-[11px] rounded-[14px] border border-line bg-card p-3 shadow-card"
        >
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-blue-light font-en text-xs font-extrabold text-blue-dark">
            {bn(i + 1)}
          </div>
          <div className="text-[13.5px] font-medium text-text">{item}</div>
        </div>
      ))}
    </OverlayShell>
  );
}
