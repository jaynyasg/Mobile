import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { getProgram } from "@/content/active";
import { useContent } from "@/content/provider";
import { displayCopy } from "@/content/display";
import type { Session } from "@/content/types";
import { sessionDateLine } from "@/logic/dayTheme";
import { sessionTopic } from "@/logic/topic";
import { useApp } from "@/store";
import { addStamp, pulse, prefersReducedMotion, sessionStamp } from "@/guide/stamps";
import { localReelStore } from "@/reels/gate";
import { colors, sceneForIsland } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";
import { TopicChip } from "./TopicChip";

export function sessionWhen(session: Session, timeZone = getProgram().forum.timezone): string {
  return sessionDateLine(session, getProgram().forum.days, timeZone);
}

export function SessionRow({ session }: { session: Session }) {
  const { state, dispatch } = useApp();
  const { program } = useContent();
  const favored = state.favoriteIds.includes(session.id);
  const photo = sceneForIsland(session.island);
  const topic = sessionTopic(session, program.forum.pillars);
  const when = sessionWhen(session, program.forum.timezone);

  return (
    <View style={styles.card}>
      <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View style={styles.shade} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favored ? `Remove ${session.title} from favorites` : `Save ${session.title}`}
        onPress={() => {
          const next = !favored;
          dispatch({ type: "toggleFavorite", id: session.id });
          if (next && addStamp(localReelStore(), sessionStamp(session.id))) pulse(prefersReducedMotion());
        }}
        style={styles.heart}
      >
        <Icon name={favored ? "heartFill" : "heart"} color={colors.gold} />
      </Pressable>
      <View style={styles.copy}>
        {topic ? <TopicChip id={topic.id} name={topic.name} /> : null}
        <T variant="rowTitle" color={colors.foam} numberOfLines={2}>{displayCopy(session.title)}</T>
        <T variant="meta" color={colors.gold} numberOfLines={2}>{when} · {session.island}</T>
        <Link href={{ pathname: "/session/[id]", params: { id: session.id } }} asChild>
          <Pressable accessibilityRole="button" accessibilityLabel={`Open ${session.title}`} style={styles.pill}>
            <T variant="button" color={colors.ink}>Open</T>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 220,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "#071421",
  },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  shade: { position: "absolute", left: 0, right: 0, bottom: 0, height: "78%", backgroundColor: "rgba(6,14,24,0.45)" },
  heart: { position: "absolute", top: 8, right: 8, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  copy: { gap: 4, padding: 12, zIndex: 1 },
  pill: { alignSelf: "flex-start", minHeight: 40, marginTop: 4, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
