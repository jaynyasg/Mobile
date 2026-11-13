import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { SessionRow } from "@/components/SessionRow";
import { StackHeader } from "@/components/StackHeader";
import { EmptyState } from "@/components/ui";
import { mySchedule } from "@/logic/agenda";
import { useApp } from "@/store";

export default function ScheduleScreen() {
  const { program } = useContent();
  const { sessions } = program;
  const { state } = useApp();
  const mine = mySchedule(sessions, state.favoriteIds);

  return (
    <Screen edge="none">
      <StackHeader title="My schedule" />
      {mine.length === 0 ? (
        <EmptyState title="Nothing saved yet" body="Save a session and it waits here, on this device." />
      ) : (
        mine.map((session) => <SessionRow key={session.id} session={session} />)
      )}
    </Screen>
  );
}
