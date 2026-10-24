import { exhibitorsFor, subEventById } from "@/content";
import { ExhibitorList } from "@/components/ExhibitorList";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { EmptyState } from "@/components/ui";

export default function TalentMarketScreen() {
  const subEvent = subEventById("talent-market");
  if (!subEvent) {
    return (
      <Screen edge="none" scroll={false}>
        <StackHeader title="Talent Market" />
        <EmptyState title="Missing gathering" body="The Talent Market is not in the program." />
      </Screen>
    );
  }
  return (
    <Screen edge="none">
      <StackHeader title="Talent Market" />
      <ExhibitorList subEvent={subEvent} exhibitors={exhibitorsFor("talent-market")} showRoles />
    </Screen>
  );
}
