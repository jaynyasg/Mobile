import { communityPreviewEnabled, supabase } from "@/community/client";
import type { ContactPrefs } from "./contactPrefs";

export async function loadContactPrefsRemote(userId: string): Promise<ContactPrefs | null> {
  if (!userId || communityPreviewEnabled()) return null;
  const { data, error } = await supabase
    .from("contact_prefs")
    .select("alerts_opt_in, marketing_opt_in, phone")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    alerts: data.alerts_opt_in === true,
    marketing: data.marketing_opt_in === true,
    phone: typeof data.phone === "string" && data.phone.trim() ? data.phone : null,
  };
}

/** Best-effort. Ignored when the table is not applied yet. Does not send a message. */
export async function saveContactPrefsRemote(userId: string, prefs: ContactPrefs): Promise<void> {
  if (!userId || communityPreviewEnabled()) return;
  await supabase.from("contact_prefs").upsert(
    {
      user_id: userId,
      alerts_opt_in: prefs.alerts,
      marketing_opt_in: prefs.marketing,
      phone: prefs.phone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}
