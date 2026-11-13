import { communityPreviewEnabled, supabase } from "@/community/client";
import type { IntakeRecord } from "./intake";

/** Best-effort copy for a signed-in person. Ignored when the table is not applied yet. */
export async function saveIntakeRemote(userId: string, record: IntakeRecord): Promise<void> {
  if (!userId || communityPreviewEnabled()) return;
  const { error } = await supabase.from("attendee_intake").upsert(
    {
      user_id: userId,
      has_pass: record.hasPass,
      areas: [...record.areas],
      needs_stay: record.needsStay,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return;
}
