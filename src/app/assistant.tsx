import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { citationHref } from "@/navigation/hrefs";
import { answerQuestion } from "@/logic/assistant";
import { createId } from "@/logic/state";
import { useApp } from "@/store";
import { colors, fonts, pad } from "@/theme";
import { nightGlass } from "@/components/nightGlass";

export default function AssistantScreen() {
  const { state, dispatch } = useApp();
  const [draft, setDraft] = useState("");

  function ask() {
    const text = draft.trim();
    if (!text) return;
    const answer = answerQuestion(text);
    dispatch({ type: "addGuideTurn", turn: { id: createId("you"), role: "you", text, citations: [] } });
    dispatch({ type: "addGuideTurn", turn: { id: createId("guide"), role: "guide", text: answer.text, citations: answer.citations } });
    setDraft("");
  }

  return (
    <Screen edge="none">
      <StackHeader title="Guide" />
      <View style={styles.pad}>
        <T variant="meta">
          The guide reads the TATEL draft stored in this app. It is not a hosted model, and it will not invent a confirmation.
        </T>
        {state.guide.map((turn) => (
          <View key={turn.id} style={styles.turn}>
            <T variant="eyebrow">{turn.role === "you" ? "You" : "Guide"}</T>
            <T variant="small">{turn.text}</T>
            {turn.citations.map((citation) => (
              <Link key={`${citation.kind}-${citation.id}`} href={citationHref(citation)} asChild>
                <Pressable accessibilityRole="button">
                  <T variant="meta" color={colors.gold}>
                    {citation.title}
                  </T>
                </Pressable>
              </Link>
            ))}
          </View>
        ))}
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask about a panelist, pillar, or route"
          placeholderTextColor="rgba(245,241,232,0.62)"
          style={styles.input}
          accessibilityLabel="Question"
        />
        <Pressable accessibilityRole="button" onPress={ask} style={styles.ask}>
          <T variant="button" color={colors.ivory}>
            Ask the draft
          </T>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { marginHorizontal: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderRadius: 18, ...nightGlass },
  turn: { gap: 4, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.42)",
    backgroundColor: "rgba(7,27,42,0.72)",
    color: colors.foam,
    fontFamily: fonts.body,
    fontSize: 16,
    padding: 12,
    minHeight: 72,
  },
  ask: { backgroundColor: colors.ink, minHeight: 48, alignItems: "center", justifyContent: "center" },
});
