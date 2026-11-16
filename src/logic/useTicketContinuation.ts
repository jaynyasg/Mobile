import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useContent } from "@/content/provider";
import { useReels } from "@/reels/ReelHost";
import { useApp } from "@/store";
import { webStorage } from "@/welcome";
import { readIntake } from "./intake";
import { readOwnedPass } from "./ownedPass";
import { buildPath, nextPathStep, pathDestination } from "./pathPlan";

/** Read current progress at the moment a guest pays or explicitly chooses to book later. */
export function useTicketContinuation() {
  const router = useRouter();
  const { program } = useContent();
  const { state } = useApp();
  const { openChapter } = useReels();
  return useCallback(() => {
    const intake = readIntake(webStorage());
    const ownedTier = readOwnedPass(webStorage());
    const steps = intake ? buildPath(intake, program.forum.pillars, {
      completed: intake.completed, ownedTier,
      savedSessionCount: state.favoriteIds.filter((id) => program.sessions.some((session) => session.id === id)).length,
    }) : [];
    const next = nextPathStep(steps, "pass");
    const target = next ? pathDestination(next.id, intake ?? undefined) : { pathname: intake ? "/explore" as const : "/agenda" as const };
    if (target.pathname === "/stays") openChapter("stays", target);
    else if (target.pathname === "/agenda") openChapter("sessions", target);
    else if (target.pathname === "/explore") openChapter("venues", target);
    else router.navigate(target);
  }, [openChapter, program, router, state.favoriteIds]);
}
