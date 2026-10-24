import { forum, sessions } from "@/content";
import { Screen } from "@/components/Screen";
import { SessionRow } from "@/components/SessionRow";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { EmptyState } from "@/components/ui";
import { mySchedule } from "@/logic/agenda";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";

export default function ScheduleScreen() {
  const { state } = useApp();
  const mine = mySchedule(sessions, state.favoriteIds, state.heldSeatIds);
  return (
    <Screen edge="none">
      <StackHeader title="My schedule" />
      <T variant="meta" style={styles.intro}>
        Favorites and saved seats, in order. A heart keeps a session. A seat hold also counts against the room.
      </T>
      {mine.length === 0 ? (
        <EmptyState title="Nothing saved yet" body="Star a session, or save a seat, and it will gather here." />
      ) : (
        forum.days.map((day) => {
          const items = mine.filter((session) => session.dayId === day.id);
          if (items.length === 0) return null;
          return (
            <ViewBlock key={day.id} label={`${day.weekday}, ${day.month} ${day.dayNumber}`} ids={items.map((item) => item.id)} />
          );
        })
      )}
    </Screen>
  );
}

function ViewBlock({ label, ids }: { label: string; ids: string[] }) {
  return (
    <>
      <T variant="eyebrow" style={styles.day}>
        {label}
      </T>
      {ids.map((id) => {
        const session = sessions.find((item) => item.id === id);
        return session ? <SessionRow key={id} session={session} /> : null;
      })}
    </>
  );
}

const styles = {
  intro: { paddingHorizontal: pad, marginBottom: 12 },
  day: { paddingHorizontal: pad, marginTop: 8, marginBottom: 4 },
};
