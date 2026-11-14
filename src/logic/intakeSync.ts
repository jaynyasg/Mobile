import { communityPreviewEnabled, supabase } from "@/community/client";
import type { IntakeRecord } from "./intake";
import type { PassAnswer, StayAnswer } from "./pathPlan";

/** The applied table check does not list skipped. A skip is the non-committal answer. */
function remotePass(value: PassAnswer): Exclude<PassAnswer, "skipped"> {
  return value === "skipped" ? "unsure" : value;
}

function remoteStay(value: StayAnswer): Exclude<StayAnswer, "skipped"> {
  return value === "skipped" ? "browsing" : value;
}

/** Best-effort copy for a signed-in person. Ignored when the table is not applied yet. */
export async function saveIntakeRemote(userId: string, record: IntakeRecord): Promise<void> {
  if (!userId || communityPreviewEnabled()) return;
  const { error } = await supabase.from("attendee_intake").upsert(
    {
      user_id: userId,
      has_pass: remotePass(record.hasPass),
      areas: [...record.areas],
      needs_stay: remoteStay(record.needsStay),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return;
}
