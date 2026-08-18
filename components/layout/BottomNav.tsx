"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons/Icon";

const BASE_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/journey", label: "Journey", icon: "map" },
  { href: "/kpi", label: "KPI", icon: "trending" },
  { href: "/assistant", label: "AI Assistant", icon: "assistantNav" },
  { href: "/profile", label: "Profile", icon: "user" },
];

interface BottomNavProps {
  showTeamTab?: boolean;
  /** Akij Light Engineering (and any future variant with nav_mode='resources')
   * has no KPI feature at all — its third tab is Resources instead. */
  navMode?: "kpi" | "resources";
}

export function BottomNav({ showTeamTab, navMode = "kpi" }: BottomNavProps) {
  const pathname = usePathname();

  // The Assistant screen replaces the bottom nav with its own fixed chat input bar,
  // matching the prototype's chatInput/nav toggle behavior.
  if (pathname.startsWith("/assistant")) return null;

  const baseItems =
    navMode === "resources"
      ? BASE_ITEMS.map((item) =>
          item.href === "/kpi" ? { href: "/resources", label: "Resources", icon: "book" as IconName } : item,
        )
      : BASE_ITEMS;

  const items = showTeamTab
    ? [...baseItems.slice(0, 2), { href: "/team", label: "Team", icon: "users" as IconName }, ...baseItems.slice(2)]
    : baseItems;

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 flex border-t border-line bg-card px-1.5 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-[3px] px-0.5 py-1.5 font-en text-[11px] font-semibold ${
              active ? "text-green-dark" : "text-muted"
            }`}
          >
            <Icon name={item.icon} size={24} strokeWidth={1.9} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
