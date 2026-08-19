"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/icons/Icon";
import { useOverlay } from "@/components/journey/OverlayProvider";

interface HrService {
  key: string;
  label: string;
  sub: string;
  icon: IconName;
  blue?: boolean;
  href?: string;
}

interface HrServicesGridProps {
  managerPhone?: string | null;
  buddyPhone?: string | null;
  buddyAssigned?: boolean;
  /** A variant-scoped HR admin has no use for the AI Assistant card — it's
   * replaced by an Employees card, mirroring BottomNav's showEmployeesTab. */
  showEmployeesCard?: boolean;
}

export function HrServicesGrid({ managerPhone, buddyPhone, buddyAssigned, showEmployeesCard }: HrServicesGridProps) {
  const { openContact, notify } = useOverlay();

  const HR_SERVICES: HrService[] = [
    { key: "hr", label: "HR", sub: "মানব সম্পদ বিভাগ", icon: "users" },
    { key: "it", label: "IT সাপোর্ট", sub: "সিস্টেম অ্যাক্সেস", icon: "monitor" },
    { key: "manager", label: "ম্যানেজার", sub: managerPhone || "টিম লিড", icon: "briefcase" },
    { key: "buddy", label: "বাডি", sub: buddyAssigned ? buddyPhone || "মেন্টর" : "এখনো নির্ধারণ হয়নি", icon: "userCheck" },
    { key: "helpCalls", label: "হেল্প কল", sub: "আপনার জমা দেওয়া টিকেট", icon: "ticket", blue: true, href: "/help-calls" },
    showEmployeesCard
      ? { key: "employees", label: "কর্মীরা", sub: "অনবোর্ডিং তালিকা দেখুন", icon: "briefcase", blue: true, href: "/employees" }
      : { key: "assistant", label: "AI সহকারী", sub: "যা খুশি জিজ্ঞাসা করুন", icon: "chat", blue: true, href: "/assistant" },
  ];

  function handleClick(key: string) {
    if (key === "buddy" && !buddyAssigned) {
      notify("আপনার ম্যানেজার শীঘ্রই আপনার বাডি নির্ধারণ করবেন", "userCheck");
      return;
    }
    openContact(key);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {HR_SERVICES.map((s) => {
        const iconEl = (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              s.blue ? "bg-blue-light text-blue-dark" : "bg-green-light text-green-dark"
            }`}
          >
            <Icon name={s.icon} size={20} />
          </div>
        );
        const content = (
          <>
            {iconEl}
            <div>
              <div className="font-en text-sm font-bold text-text">{s.label}</div>
              <div className="mt-px text-[11px] font-medium text-muted">{s.sub}</div>
            </div>
          </>
        );
        const className =
          "flex flex-col gap-2 rounded-card border border-line bg-card p-3.5 shadow-card transition-transform active:scale-[0.98]";

        if (s.href) {
          return (
            <Link key={s.key} href={s.href} className={className}>
              <div className="flex items-center gap-3">{content}</div>
            </Link>
          );
        }
        return (
          <button key={s.key} onClick={() => handleClick(s.key)} className={className}>
            <div className="flex items-center gap-3">{content}</div>
          </button>
        );
      })}
    </div>
  );
}
