import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeVariant } from "@/lib/data/queries";
import { Icon } from "@/components/icons/Icon";

export default async function ResourcesPage() {
  const variant = await getEmployeeVariant();
  // Nav only ever links here for a resources-mode variant — a default-variant
  // (KPI) employee landing here via direct URL gets sent to their real tab,
  // mirroring how /kpi should redirect resources-mode employees away.
  if (variant.navMode !== "resources") redirect("/kpi");

  const supabase = await createClient();
  const { data: links } = await supabase
    .from("resource_links")
    .select("*")
    .eq("variant_id", variant.id)
    .eq("active", true)
    .order("category")
    .order("sequence");

  const byCategory = new Map<string, { title: string; url: string }[]>();
  for (const link of links ?? []) {
    const list = byCategory.get(link.category) ?? [];
    list.push({ title: link.title, url: link.url });
    byCategory.set(link.category, list);
  }

  return (
    <div>
      <div className="mb-4 mt-0.5 font-en text-xl font-bold text-text">রিসোর্স</div>

      {byCategory.size === 0 && (
        <div className="rounded-card border border-line bg-card p-4 text-center text-sm font-medium text-muted shadow-card">
          এখনো কোনো রিসোর্স যোগ করা হয়নি।
        </div>
      )}

      {Array.from(byCategory.entries()).map(([category, items]) => (
        <div key={category} className="mb-4">
          <div className="mb-2.5 font-en text-[15px] font-bold text-text">{category}</div>
          <div className="rounded-card border border-line bg-card px-4 shadow-card">
            {items.map((item, i) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between gap-3.5 py-3 ${
                  i < items.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <span className="text-[13px] font-semibold text-text">{item.title}</span>
                <Icon name="chevronRight" size={16} className="shrink-0 text-muted" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
