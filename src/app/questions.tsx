import { Link } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { polls, sessionById } from "@/content";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { EmptyState } from "@/components/ui";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";

export default function QuestionsScreen() {
  const { state } = useApp();
  const votes = Object.entries(state.pollVotes);
  const empty = votes.length === 0 && state.questions.length === 0;
  return (
    <Screen edge="none">
      <StackHeader title="Questions and polls" />
      <T variant="meta" style={styles.intro}>
        Votes and questions you save from a session. They stay on this device, and they are cleared by Delete my data.
      </T>
      {empty ? (
        <EmptyState title="Nothing saved yet" body="Open a session to vote in a poll or leave a question." />
      ) : null}
      {votes.map(([pollId, optionId]) => {
        const poll = polls.find((item) => item.id === pollId);
        const option = poll?.options.find((item) => item.id === optionId);
        const session = poll ? sessionById(poll.sessionId) : undefined;
        if (!poll || !option || !session) return null;
        return (
          <Link key={pollId} href={{ pathname: "/session/[id]", params: { id: session.id } }} asChild>
            <Pressable style={styles.card}>
              <T variant="eyebrow">{session.title}</T>
              <T variant="rowTitle">{poll.question}</T>
              <T variant="small">Your vote: {option.label}</T>
            </Pressable>
          </Link>
        );
      })}
      {state.questions.map((question) => {
        const session = sessionById(question.sessionId);
        return (
          <Link key={question.id} href={{ pathname: "/session/[id]", params: { id: question.sessionId } }} asChild>
            <Pressable style={styles.card}>
              <T variant="eyebrow">{session?.title ?? "Session"}</T>
              <T variant="small">{question.text}</T>
            </Pressable>
          </Link>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: pad, marginBottom: 8 },
  card: {
    marginHorizontal: pad,
    marginBottom: 10,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
  },
});
