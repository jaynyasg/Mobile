import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { getProgram } from "@/content/active";
import { useContent } from "@/content/provider";
import { displayCopy } from "@/content/display";
import type { Session } from "@/content/types";
import { sessionDateLine } from "@/logic/dayTheme";
import { sessionTopic } from "@/logic/topic";
import { phaseTag, sessionInterest } from "@/logic/techInterest";
import { useApp } from "@/store";
import { colors, sceneForIsland } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";
import { TopicChip } from "./TopicChip";
import { useState } from "react";

export function sessionWhen(session: Session, timeZone = getProgram().forum.timezone): string {
  return sessionDateLine(session, getProgram().forum.days, timeZone);
}

export function SessionRow({ session, showOutcome = false }: { session: Session; showOutcome?: boolean }) {
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const { state, dispatch } = useApp();
  const { program } = useContent();
  const favored = state.favoriteIds.includes(session.id);
  const photo = sceneForIsland(session.island);
  const router = useRouter();
  const topic = sessionTopic(session, program.forum.pillars);
  const interest = sessionInterest(session);
  const when = sessionWhen(session, program.forum.timezone);
  const kind = phaseTag(session.phase);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${session.title}`} onPress={() => router.push({ pathname: "/session/[id]", params: { id: session.id } })} style={styles.card}>
      <Image pointerEvents="none" source={{ uri: photo }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View pointerEvents="none" style={styles.shade} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favored ? `Remove ${session.title} from favorites` : `Save ${session.title}`}
        onPress={(event) => {
          event.stopPropagation();
          dispatch({ type: "toggleFavorite", id: session.id });
        }}
        style={styles.heart}
      >
        <Icon name={favored ? "heartFill" : "heart"} color={colors.gold} />
      </Pressable>
      <View pointerEvents="none" style={styles.copy}>
        <View style={styles.tags}>
          <TopicChip id={topic?.id ?? "tech"} name={topic?.name ?? "Session"} />
          {interest ? <TopicChip id={topic?.id ?? "tech"} name={interest} /> : null}
          {kind ? <TopicChip id={topic?.id ?? "tech"} name={kind} /> : null}
        </View>
        <T variant="rowTitle" color={colors.foam} numberOfLines={2}>{displayCopy(session.title)}</T>
        <T variant="meta" color={colors.gold} numberOfLines={2}>{when} · {session.island}</T>
        {showOutcome && outcomeOpen && session.outcome ? <T variant="small" color={colors.foam}>{displayCopy(session.outcome)}</T> : null}
        <View style={styles.pill}>
          <T variant="button" color={colors.ink}>Open</T>
        </View>
      </View>
      {showOutcome && session.outcome ? <Pressable accessibilityRole="button" accessibilityLabel={`Session goal: ${session.title}`} aria-expanded={outcomeOpen} onPress={event => { event.stopPropagation(); setOutcomeOpen(!outcomeOpen); }} style={styles.goal}><T variant="button" color={colors.gold}>{outcomeOpen ? "Hide session goal −" : "See session goal +"}</T></Pressable> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 220,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "#071421",
  },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  shade: { position: "absolute", left: 0, right: 0, bottom: 0, height: "100%", backgroundColor: "rgba(6,14,24,0.68)" },
  goal: { minHeight: 44, paddingHorizontal: 16, paddingBottom: 12, justifyContent: "center", zIndex: 1 },
  heart: { position: "absolute", top: 8, right: 8, zIndex: 3, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(7,20,33,0.9)", alignItems: "center", justifyContent: "center" },
  copy: { gap: 6, padding: 16, paddingTop: 60, zIndex: 1, width: "100%", minWidth: 0 },
  pill: { alignSelf: "flex-start", minHeight: 40, marginTop: 4, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
