// Fixed set — the app's contact lookups (HrServicesGrid, the "dept"-tagged
// task fallback in app/(app)/layout.tsx, etc.) reference these specific
// keys by name. A variant creating a row under any other key would just be
// dead data nothing ever renders, so admin forms constrain to this list
// instead of allowing free text.
//
// Lives outside actions/admin-contacts.ts because a "use server" file may
// only export async functions — a plain constant export breaks the build.
export const CONTACT_KEYS = ["hr", "it", "manager", "buddy", "dept", "training"] as const;
