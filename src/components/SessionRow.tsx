import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { forum } from "@/content";
import { displayCopy } from "@/content/display";
import type { Session } from "@/content/types";
import { formatRange } from "@/logic/time";
import { useApp } from "@/store";
import { colors, sceneForIsland } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

export function sessionWhen(session: Session): string {
  if (session.start && session.end) return formatRange(session.start, session.end, forum.timezone);
  return session.timeLabel || "Time TBC";
}

export function SessionRow({ session }: { session: Session }) {
  const { state, dispatch } = useApp();
  const favored = state.favoriteIds.includes(session.id);
  const photo = sceneForIsland(session.island).replace("-1280.webp", "-640.webp");

  return (
    <View style={styles.row}>
      <Image source={{ uri: photo }} style={styles.thumb} accessibilityIgnoresInvertColors />
      <Link href={{ pathname: "/session/[id]", params: { id: session.id } }} asChild>
        <Pressable accessibilityRole="button" accessibilityLabel={session.title} style={styles.main}>
          <T variant="rowTitle" color={colors.onDark} numberOfLines={2}>{displayCopy(session.title)}</T>
          <T variant="meta" color={colors.gold}>{sessionWhen(session)} · {session.island}</T>
        </Pressable>
      </Link>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favored ? `Remove ${session.title} from favorites` : `Save ${session.title}`}
        hitSlop={8}
        onPress={() => dispatch({ type: "toggleFavorite", id: session.id })}
        style={styles.heart}
      >
        <Icon name={favored ? "heartFill" : "heart"} color={favored ? colors.gold : colors.onDarkSoft} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(247,244,239,0.28)",
  },
  thumb: { width: 54, height: 54, borderRadius: 8 },
  main: { flex: 1, gap: 3 },
  heart: { width: 32, alignItems: "center", justifyContent: "center" },
});
