import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { getProgram } from "@/content/active";
import { useContent } from "@/content/provider";
import { displayCopy } from "@/content/display";
import type { Session } from "@/content/types";
import { formatRange } from "@/logic/time";
import { sessionTopic } from "@/logic/topic";
import { useApp } from "@/store";
import { colors, sceneForIsland } from "@/theme";
import { nightGlass } from "./nightGlass";
import { Icon } from "./Icon";
import { T } from "./Text";
import { TopicChip } from "./TopicChip";

export function sessionWhen(session: Session, timeZone = getProgram().forum.timezone): string {
  if (session.start && session.end) return formatRange(session.start, session.end, timeZone);
  return session.timeLabel || "Time TBC";
}

export function SessionRow({ session }: { session: Session }) {
  const { state, dispatch } = useApp();
  const { program } = useContent();
  const favored = state.favoriteIds.includes(session.id);
  const photo = sceneForIsland(session.island);
  const topic = sessionTopic(session, program.forum.pillars);
  const when = sessionWhen(session, program.forum.timezone);

  return (
    <View style={styles.row}>
      <View style={styles.thumb}>
        <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      </View>
      <Link href={{ pathname: "/session/[id]", params: { id: session.id } }} asChild>
        <Pressable accessibilityRole="button" accessibilityLabel={session.title} style={styles.main}>
          {topic ? <TopicChip id={topic.id} name={topic.name} /> : null}
          <T variant="rowTitle" numberOfLines={2}>{displayCopy(session.title)}</T>
          <T variant="meta" color={colors.gold} numberOfLines={1} style={styles.when}>{when} · {session.island}</T>
        </Pressable>
      </Link>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favored ? `Remove ${session.title} from favorites` : `Save ${session.title}`}
        hitSlop={8}
        onPress={() => dispatch({ type: "toggleFavorite", id: session.id })}
        style={styles.heart}
      >
        <Icon name={favored ? "heartFill" : "heart"} color={favored ? colors.gold : colors.foam} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    ...nightGlass,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
  },
  thumb: { width: 84, height: 84, borderRadius: 12, overflow: "hidden" },
  photo: { width: 84, height: 84 },
  main: { flex: 1, minWidth: 0, gap: 4, justifyContent: "center" },
  when: { overflow: "hidden" },
  heart: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
