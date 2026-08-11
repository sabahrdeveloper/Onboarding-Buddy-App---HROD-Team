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
}

export function HrServicesGrid({ managerPhone, buddyPhone, buddyAssigned }: HrServicesGridProps) {
  const { openContact, notify } = useOverlay();

  const HR_SERVICES: HrService[] = [
    { key: "hr", label: "HR", sub: "Human Resources", icon: "users" },
    { key: "it", label: "IT Support", sub: "System access", icon: "monitor" },
    { key: "manager", label: "Manager", sub: managerPhone || "Team lead", icon: "briefcase" },
    { key: "buddy", label: "Buddy", sub: buddyAssigned ? buddyPhone || "Mentor" : "Not assigned yet", icon: "userCheck" },
    { key: "helpCalls", label: "Help Calls", sub: "Your submitted tickets", icon: "ticket", blue: true, href: "/help-calls" },
    { key: "assistant", label: "AI Assistant", sub: "Ask anything", icon: "chat", blue: true, href: "/assistant" },
  ];

  function handleClick(key: string) {
    if (key === "buddy" && !buddyAssigned) {
      notify("Your Buddy will soon be assigned by your Manager", "userCheck");
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
