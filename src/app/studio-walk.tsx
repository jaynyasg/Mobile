import { exhibitorsFor, subEventById } from "@/content";
import { ExhibitorList } from "@/components/ExhibitorList";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { EmptyState } from "@/components/ui";

export default function StudioWalkScreen() {
  const subEvent = subEventById("studio-walk");
  if (!subEvent) {
    return (
      <Screen edge="none" scroll={false}>
        <StackHeader title="Studio Walk" />
        <EmptyState title="Missing gathering" body="The Studio Walk is not in the program." />
      </Screen>
    );
  }
  return (
    <Screen edge="none">
      <StackHeader title="Studio Walk" />
      <ExhibitorList subEvent={subEvent} exhibitors={exhibitorsFor("studio-walk")} />
    </Screen>
  );
}
