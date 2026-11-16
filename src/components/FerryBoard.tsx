import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BVI_ENTRY, CHARTER_CONTRAST, FERRY_NOTE, OFFICIAL_BVI_FERRY_URL, OFFICIAL_USVI_FERRY_URL, adviceForSession, ferryLegs, type FerrySession } from "@/logic/ferrySchedule";
import { FERRY_DOCKS, LOVANGO_FERRY_BOOK_URL, boardingFor, dockById } from "@/logic/ferryDocks";
import { colors } from "@/theme";
import { nightGlass } from "./nightGlass";
import { ExternalLink, ExternalText } from "./ExternalLink";
import { T } from "./Text";

export function FerryBoard({ dayId, sessions }: { dayId: string; sessions: readonly FerrySession[] }) {
  const [open, setOpen] = useState<string | null>(ferryLegs[0]?.id ?? null);
  const daySessions = useMemo(
    () => sessions.filter((session) => session.dayId === dayId && session.start && session.featured),
    [dayId, sessions],
  );

  return (
    <View style={styles.wrap}>
      <T variant="eyebrow" color={colors.gold}>Be on the Beach · public ferries</T>
      <ExternalLink href={OFFICIAL_USVI_FERRY_URL} label="Official USVI ferry schedule">Official USVI ferry schedule</ExternalLink>
      <ExternalLink href={OFFICIAL_BVI_FERRY_URL} label="Official BVI ferry schedules">Official BVI ferry schedules</ExternalLink>
      <T variant="small" color={colors.foam}>{FERRY_NOTE}</T>
      <T variant="small" color={colors.foam}>{BVI_ENTRY}</T>
      <T variant="small" color={colors.foam}>{CHARTER_CONTRAST}</T>
      <T variant="rowTitle" color={colors.foam}>Where to board</T>
      <T variant="small" color={colors.foam}>These are the docks with a pin. A route with no pin below does not get one invented.</T>
      {FERRY_DOCKS.map((dock) => (
        <ExternalLink key={dock.id} href={dock.url} label={dock.name}>{dock.name}</ExternalLink>
      ))}
      <ExternalLink href={LOVANGO_FERRY_BOOK_URL} label="Book the Lovango ferry">Book the Lovango ferry</ExternalLink>
      {ferryLegs.map((leg) => {
        const shown = open === leg.id;
        return (
          <View key={leg.id} style={styles.card}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: shown }} accessibilityLabel={leg.title} onPress={() => setOpen(shown ? null : leg.id)}>
              <T variant="rowTitle" color={colors.foam}>{leg.title}</T>
              <T variant="meta" color={colors.gold}>{leg.operator}</T>
            </Pressable>
            {shown ? (
              <View style={styles.body}>
                <T variant="small" color={colors.foam}>{leg.days}</T>
                <T variant="meta" color={colors.gold}>Departs {leg.from}</T>
                <LegDocks legId={leg.id} />
                <T variant="small" color={colors.foam}>{leg.departures.join(" · ")}</T>
                {leg.crossing ? <T variant="small" color={colors.foam}>{leg.crossing}</T> : <T variant="small" color={colors.foam}>The page does not print how long the crossing takes.</T>}
                <T variant="meta" color={colors.foam}>{leg.asOf}</T>
                <ExternalText href={leg.sourceUrl} label={leg.sourceTitle} />
              </View>
            ) : null}
          </View>
        );
      })}
      <T variant="eyebrow" color={colors.gold}>Which ferry for this day's sessions</T>
      <T variant="small" color={colors.foam}>Featured sessions with a clock time. The session room is still to be confirmed, so this is the boat to the island, not a walk from the dock.</T>
      {daySessions.length === 0 ? <T variant="small" color={colors.foam}>No timed featured session on this day.</T> : null}
      {daySessions.map((session) => {
        const advice = adviceForSession(session);
        const when = session.start?.slice(11, 16) ?? "";
        return (
          <View key={session.id} style={styles.card}>
            <T variant="meta" color={colors.gold}>{when} · {session.island}</T>
            <T variant="rowTitle" color={colors.foam}>{session.title}</T>
            {advice.catches.map((item) => (
              <T key={item.legId} variant="small" color={item.status === "tight" ? "#FFB4A2" : colors.foam}>
                {item.status === "tight" ? "Tight. " : "Catch "}{item.line}
              </T>
            ))}
            {advice.missed.map((line) => (
              <T key={line} variant="small" color="#FFB4A2">{line}</T>
            ))}
            {advice.catches.length === 0 && advice.missed.length === 0 ? (
              <T variant="small" color={colors.foam}>No public ferry in this list ends on {session.island}. Stay on that island, or use the day charter.</T>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function LegDocks({ legId }: { legId: string }) {
  const boarding = boardingFor(legId);
  return (
    <View style={styles.body}>
      {boarding.board.map((id) => {
        const dock = dockById(id);
        return <ExternalLink key={id} href={dock.url} label={`Where to board: ${dock.name}`}>{`Where to board: ${dock.name}`}</ExternalLink>;
      })}
      {boarding.land.map((id) => {
        const dock = dockById(id);
        return <ExternalLink key={id} href={dock.url} label={`Lands at ${dock.name}`}>{`Lands at ${dock.name}`}</ExternalLink>;
      })}
      {boarding.note ? <T variant="small" color={colors.foam}>{boarding.note}</T> : null}
      {boarding.book ? <ExternalLink href={LOVANGO_FERRY_BOOK_URL} label="Book the Lovango ferry">Book the Lovango ferry</ExternalLink> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: { padding: 12, gap: 6, borderRadius: 16, ...nightGlass },
  body: { gap: 6 },
});
