import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { answerQuestion } from "@/logic/assistant";
import { createId } from "@/logic/state";
import { citationHref } from "@/navigation/hrefs";
import { useApp } from "@/store";
import { colors, fonts, pad } from "@/theme";

const prompts = [
  "When does Mira Chen speak?",
  "Where do I pick up a badge?",
  "What is the Studio Walk?",
  "Which talks are on the climate track?",
];

export default function AssistantScreen() {
  const { state, dispatch } = useApp();
  const [draft, setDraft] = useState("");

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const answer = answerQuestion(trimmed);
    dispatch({ type: "addGuideTurn", turn: { id: createId("you"), role: "you", text: trimmed, citations: [] } });
    dispatch({
      type: "addGuideTurn",
      turn: { id: createId("guide"), role: "guide", text: answer.text, citations: answer.citations },
    });
    setDraft("");
  }

  return (
    <Screen edge="none">
      <StackHeader title="Guide" />
      <View style={styles.body}>
        <T variant="title">Ask the program</T>
        <T variant="meta">
          On this device. The guide only reads the Portico program. It does not send your question anywhere.
        </T>
        <View style={styles.prompts}>
          {prompts.map((prompt) => (
            <Pressable key={prompt} accessibilityRole="button" onPress={() => ask(prompt)} style={styles.prompt}>
              <T variant="small">{prompt}</T>
            </Pressable>
          ))}
        </View>
        {state.guide.map((turn) => (
          <View key={turn.id} style={[styles.turn, turn.role === "you" ? styles.you : styles.guide]}>
            <T variant="eyebrow" color={turn.role === "you" ? colors.brassSoft : colors.inkSoft}>
              {turn.role === "you" ? "You" : "Guide"}
            </T>
            <T variant="small" color={turn.role === "you" ? colors.ivory : colors.ink}>
              {turn.text}
            </T>
            {turn.citations.map((citation) => (
              <Link key={`${citation.kind}-${citation.id}`} href={citationHref(citation)}>
                <T variant="small" color={colors.brass}>
                  {citation.title}
                </T>
              </Link>
            ))}
          </View>
        ))}
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask about a session, a room, a person"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          onSubmitEditing={() => ask(draft)}
        />
        <Pressable accessibilityRole="button" onPress={() => ask(draft)} style={styles.ask}>
          <T variant="button" color={colors.ivory}>
            Ask
          </T>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: pad, gap: 12 },
  prompts: { gap: 8 },
  prompt: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  turn: { padding: 14, borderRadius: 4, gap: 6 },
  you: { backgroundColor: colors.pine },
  guide: { backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.line },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 10,
    marginTop: 8,
  },
  ask: { backgroundColor: colors.pine, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 4 },
});
