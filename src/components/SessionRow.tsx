import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { forum, panelistNames, pillarById } from "@/content";
import { displayCopy, SPEAKER_TBA } from "@/content/display";
import type { Session } from "@/content/types";
import { deviceTimeZone, formatRange, sameClock } from "@/logic/time";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

export function sessionWhen(session: Session): string {
  if (session.start && session.end) return formatRange(session.start, session.end, forum.timezone);
  return session.timeLabel || "Time TBC";
}

export function SessionRow({ session }: { session: Session }) {
  const { state, dispatch } = useApp();
  const localZone = deviceTimeZone();
  const favored = state.favoriteIds.includes(session.id);
  const pillar = pillarById(session.pillarId);
  const names = panelistNames(session.speakerIds);
  const timed = Boolean(session.start && session.end);
  const same = timed && session.start ? sameClock(session.start, forum.timezone, localZone) : true;
  const kind = session.supplemental ? "Supplementary" : session.featured ? "Featured" : "Session";

  return (
    <View style={[styles.row, session.featured && styles.featured]}>
      <View style={[styles.tick, { backgroundColor: session.featured ? colors.brassSoft : colors.ink }]} />
      <Link href={{ pathname: "/session/[id]", params: { id: session.id } }} asChild>
        <Pressable accessibilityRole="button" accessibilityLabel={session.title} style={styles.main}>
          <View style={styles.copy}>
            <T variant="eyebrow">{session.optional ? `${kind} · Optional` : kind}</T>
            <T variant="rowTitle">{displayCopy(session.title)}</T>
            <T variant="meta">
              {sessionWhen(session)}
              {pillar ? ` · ${pillar.name}` : ""} · {session.island}
            </T>
            <T variant="meta">{names || SPEAKER_TBA}</T>
            <T variant="meta">Venue: {session.venue.specific || session.venue.label}</T>
            {timed && session.start && session.end ? (
              <T variant="meta" color={colors.brass}>
                {same ? "Same clock as this phone" : `${formatRange(session.start, session.end, localZone)} · your time`}
              </T>
            ) : null}
          </View>
        </Pressable>
      </Link>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favored ? `Remove ${session.title} from favorites` : `Save ${session.title}`}
        hitSlop={8}
        onPress={() => dispatch({ type: "toggleFavorite", id: session.id })}
        style={styles.heart}
      >
        <Icon name={favored ? "heartFill" : "heart"} color={favored ? colors.ink : colors.inkSoft} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingRight: pad,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    backgroundColor: colors.paper,
  },
  featured: { backgroundColor: "#F8F1D8" },
  tick: { width: 3 },
  main: { flex: 1, paddingVertical: 14, paddingLeft: pad },
  copy: { gap: 3 },
  heart: { width: 40, alignItems: "center", justifyContent: "center" },
});
