import { redirect } from "next/navigation";
import { getEmployeeVariant } from "@/lib/data/queries";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/leaderboard";

const BORDER_COLOR: Record<number, string> = {
  1: "#D4AF37",
  2: "#A8A9AD",
  3: "#CD7F32",
};

const PODIUM_HEIGHT: Record<number, string> = {
  1: "128px",
  2: "96px",
  3: "72px",
};

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function PodiumSlot({ entry }: { entry: LeaderboardEntry | undefined }) {
  if (!entry) return <div className="flex-1" />;
  const borderColor = BORDER_COLOR[entry.rank];
  return (
    <div className="flex flex-1 flex-col items-center justify-end">
      <div className="relative mb-2">
        {entry.rank === 1 && (
          <div className="absolute -top-[22px] left-1/2 -translate-x-1/2 text-2xl leading-none" aria-hidden>
            👑
          </div>
        )}
        <div
          className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-green-light font-en text-lg font-extrabold text-green-dark"
          style={{ border: `3px solid ${borderColor}` }}
        >
          {entry.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage public URL, not a static import next/image can optimize
            <img src={entry.photoUrl} alt={entry.name} className="h-full w-full object-cover" />
          ) : (
            initials(entry.name)
          )}
        </div>
      </div>
      <div className="mb-1 max-w-[90px] truncate text-center text-[11.5px] font-bold text-text">{entry.name}</div>
      <div
        className="flex w-full items-start justify-center rounded-t-xl pt-1 font-en text-lg font-extrabold text-white"
        style={{ height: PODIUM_HEIGHT[entry.rank], background: borderColor }}
      >
        {entry.rank}
      </div>
    </div>
  );
}

export default async function LeaderboardPage() {
  const variant = await getEmployeeVariant();
  if (variant.isDefault) redirect("/journey");

  const isBn = variant.navMode === "resources";
  const entries = await getLeaderboard(variant.id);
  const podium = [entries.find((e) => e.rank === 2), entries.find((e) => e.rank === 1), entries.find((e) => e.rank === 3)];

  return (
    <div>
      <div className="mb-4 mt-1.5 text-center font-en text-xl font-extrabold text-text">
        {isBn ? "লিডার বোর্ড" : "Leader Board"}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-4 text-center text-sm font-medium text-muted shadow-card">
          {isBn ? "এখনো কেউ অ্যাসেসমেন্ট জমা দেননি।" : "No one has submitted an assessment yet."}
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-end gap-2 px-1">
            {podium.map((entry, i) => (
              <PodiumSlot key={entry?.enrollNumber ?? i} entry={entry} />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {entries.map((e) => (
              <div key={e.enrollNumber} className="flex items-center gap-3 rounded-card border border-line bg-card p-3 shadow-card">
                <div className="w-6 shrink-0 text-center font-en text-sm font-extrabold text-muted">{e.rank}</div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-light font-en text-xs font-extrabold text-green-dark">
                  {e.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.photoUrl} alt={e.name} className="h-full w-full object-cover" />
                  ) : (
                    initials(e.name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-text">{e.name}</div>
                  <div className="truncate text-[11px] font-medium text-muted">
                    {e.enrollNumber} · {[e.designation, e.sbu].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="shrink-0 font-en text-sm font-extrabold text-green-dark">{e.score}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
