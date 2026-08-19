import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthUser,
  getEmployee,
  getHomeVariant,
  getOnboardingVariants,
  getTasksForVariant,
  getUnreadNotificationCount,
} from "@/lib/data/queries";
import { mapOnboardingVariant } from "@/lib/onboarding-variant";
import { chooseOnboardingTrack } from "@/actions/onboarding-track";
import Link from "next/link";
import { Mascot } from "@/components/mascot/Mascot";
import { SalesMascot } from "@/components/mascot/SalesMascot";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Icon } from "@/components/icons/Icon";

export default async function SelectOnboardingPage() {
  const {
    data: { user },
  } = await getAuthUser();
  if (!user) redirect("/login");

  const [{ data: employee }, homeVariant, { data: variantsData }, unreadNotificationCount] = await Promise.all([
    getEmployee(),
    getHomeVariant(),
    getOnboardingVariants(),
    getUnreadNotificationCount(),
  ]);

  // Only relevant for an employee whose home variant runs two tracks — a
  // default-variant employee has nothing to choose, straight to /home.
  if (homeVariant.isDefault) redirect("/home");

  const variants = (variantsData ?? []).map(mapOnboardingVariant);
  const defaultVariant = variants.find((v) => v.isDefault) ?? homeVariant;

  const supabase = await createClient();
  const [{ data: orgTasks }, { data: salesTasks }, { data: statuses }] = await Promise.all([
    getTasksForVariant(defaultVariant.id),
    getTasksForVariant(homeVariant.id),
    employee
      ? supabase.from("employee_task_status").select("task_id, done").eq("employee_enroll_number", employee.enroll_number)
      : Promise.resolve({ data: [] }),
  ]);

  const doneTaskIds = new Set((statuses ?? []).filter((s) => s.done).map((s) => s.task_id));
  const orgTotal = orgTasks?.length ?? 0;
  const orgDone = (orgTasks ?? []).filter((t) => doneTaskIds.has(t.id)).length;
  const salesTotal = salesTasks?.length ?? 0;
  const salesDone = (salesTasks ?? []).filter((t) => doneTaskIds.has(t.id)).length;

  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6 py-10">
      <Link
        href="/profile"
        aria-label="Profile"
        className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-text shadow-card"
      >
        <Icon name="user" size={17} />
      </Link>

      <div className="absolute right-5 top-5">
        <NotificationBell unreadCount={unreadNotificationCount} />
      </div>

      {homeVariant.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- variant logo path is DB-driven
        <img src={homeVariant.logoUrl} alt={homeVariant.name} className="mb-8 h-10 w-auto object-contain" />
      )}

      <div className="mb-2 text-center font-en text-lg font-bold text-text">Choose Your Onboarding</div>
      <p className="mb-8 text-center text-sm font-medium text-muted">
        আপনি {homeVariant.name}-এর জন্য দুটি onboarding module থেকে বেছে নিতে পারেন।
      </p>

      <form action={chooseOnboardingTrack} className="flex w-full flex-col gap-4">
        <TrackButton
          track="org"
          title="Organization Onboarding"
          subtitle="Regular company-wide onboarding"
          done={orgDone}
          total={orgTotal}
          mascot={<Mascot variant="color" mood="happy" />}
        />
        <TrackButton
          track="sales"
          title="Sales Onboarding"
          subtitle={`${homeVariant.name}-specific onboarding`}
          done={salesDone}
          total={salesTotal}
          mascot={<SalesMascot />}
        />
      </form>
    </div>
  );
}

function TrackButton({
  track,
  title,
  subtitle,
  done,
  total,
  mascot,
}: {
  track: "org" | "sales";
  title: string;
  subtitle: string;
  done: number;
  total: number;
  mascot: React.ReactNode;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <button
      type="submit"
      name="track"
      value={track}
      className="flex items-center gap-4 rounded-card border border-line bg-card p-4 text-left shadow-card transition-transform active:scale-[0.98]"
    >
      <div className="h-14 w-14 shrink-0">{mascot}</div>
      <div className="min-w-0 flex-1">
        <div className="font-en text-[15px] font-extrabold text-text">{title}</div>
        <div className="mt-0.5 text-[12px] font-medium text-muted">{subtitle}</div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-lg bg-[#edeff2]">
          <div className="h-full rounded-lg bg-green" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-[11px] font-semibold text-muted">
          {done}/{total} works · {pct}%
        </div>
      </div>
    </button>
  );
}
