import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { forum, formatLabel, roomById, speakerNames, trackById } from "@/content";
import type { Session } from "@/content/types";
import { clockParts, deviceTimeZone, formatRange, sameClock, zoneAbbrev } from "@/logic/time";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

export function SessionRow({ session }: { session: Session }) {
  const { state, dispatch } = useApp();
  const localZone = deviceTimeZone();
  const favored = state.favoriteIds.includes(session.id);
  const held = state.heldSeatIds.includes(session.id);
  const track = trackById(session.trackId);
  const room = roomById(session.roomId);
  const names = speakerNames(session);
  const clock = clockParts(session.start, forum.timezone);
  const same = sameClock(session.start, forum.timezone, localZone);

  return (
    <View style={styles.row}>
      <View style={[styles.tick, { backgroundColor: track?.color ?? colors.ink }]} />
      <Link href={{ pathname: "/session/[id]", params: { id: session.id } }} asChild>
        <Pressable accessibilityRole="button" accessibilityLabel={session.title} style={styles.main}>
          <View style={styles.time}>
            <T variant="rowTitle">{clock.time}</T>
            <T variant="eyebrow">{clock.daypart}</T>
            <T variant="meta" style={styles.zone}>
              {zoneAbbrev(session.start, forum.timezone)}
            </T>
          </View>
          <View style={styles.copy}>
            <T variant="rowTitle">{session.title}</T>
            <T variant="meta">
              {formatLabel[session.format]}
              {room ? ` · ${room.name}` : ""}
            </T>
            {names ? <T variant="meta">{names}</T> : null}
            <T variant="meta" color={colors.brass}>
              {same ? "Same as this phone" : `${formatRange(session.start, session.end, localZone)} · your time`}
            </T>
            {held ? (
              <T variant="meta" color={colors.pine}>
                Seat saved
              </T>
            ) : null}
          </View>
        </Pressable>
      </Link>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favored ? `Remove ${session.title} from favorites` : `Save ${session.title} to favorites`}
        hitSlop={8}
        onPress={() => dispatch({ type: "toggleFavorite", id: session.id })}
        style={styles.heart}
      >
        <Icon name={favored ? "heartFill" : "heart"} color={favored ? colors.clay : colors.inkSoft} />
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
  },
  tick: { width: 3 },
  main: { flex: 1, flexDirection: "row", gap: 12, paddingVertical: 14, paddingLeft: pad },
  time: { width: 62, gap: 2 },
  zone: { fontSize: 11, lineHeight: 14 },
  copy: { flex: 1, gap: 3 },
  heart: { width: 40, alignItems: "center", justifyContent: "center" },
});
