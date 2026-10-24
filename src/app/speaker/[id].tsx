import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { sessionsForSpeaker, speakerById } from "@/content";
import { Monogram } from "@/components/Monogram";
import { Screen } from "@/components/Screen";
import { SessionRow } from "@/components/SessionRow";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { EmptyState, SectionLabel } from "@/components/ui";
import { pad } from "@/theme";

export default function SpeakerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const speaker = speakerById(String(id));
  if (!speaker) {
    return (
      <Screen edge="none" scroll={false}>
        <StackHeader title="Speaker" />
        <EmptyState title="Not on the program" body="This link does not match a speaker." />
      </Screen>
    );
  }
  const talks = sessionsForSpeaker(speaker.id);
  return (
    <Screen edge="none">
      <StackHeader title="Speaker" />
      <View style={styles.hero}>
        <Monogram name={speaker.name} size={72} />
        <T variant="title">{speaker.name}</T>
        <T variant="small">
          {speaker.title}, {speaker.company}
        </T>
        <T variant="body" style={styles.bio}>
          {speaker.bio}
        </T>
      </View>
      <SectionLabel>On the program</SectionLabel>
      {talks.map((session) => (
        <SessionRow key={session.id} session={session} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: pad, gap: 8, paddingBottom: 8 },
  bio: { marginTop: 8 },
});
