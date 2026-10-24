import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { attendees } from "@/content";
import { PersonRow } from "@/components/PersonRow";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { T } from "@/components/Text";
import { EmptyState, PageHeader, PrimaryButton, SectionLabel } from "@/components/ui";
import { visibleAttendees } from "@/logic/directory";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";

export default function NetworkScreen() {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState("");
  const people = visibleAttendees(attendees, query);
  const threads = Object.entries(state.threads).filter(([, messages]) => messages.length > 0);

  return (
    <Screen>
      <PageHeader
        kicker="Directory"
        title="Network"
        subtitle="Only people who opted in are listed. Messages stay on this phone."
      />
      <View style={styles.banner}>
        {state.networkingOptIn ? (
          <>
            <T variant="small">You are in the directory on this device.</T>
            <Pressable accessibilityRole="button" onPress={() => dispatch({ type: "setNetworkingOptIn", value: false })}>
              <T variant="button" color={colors.brass}>
                Leave the directory
              </T>
            </Pressable>
          </>
        ) : (
          <>
            <T variant="small">
              Join to message someone or request a meeting. Leaving hides the actions. Delete my data, in Settings, removes the messages too.
            </T>
            <PrimaryButton label="Join the directory" onPress={() => dispatch({ type: "setNetworkingOptIn", value: true })} />
          </>
        )}
      </View>
      {threads.length > 0 ? (
        <>
          <SectionLabel>Messages</SectionLabel>
          {threads.map(([attendeeId, messages]) => {
            const person = attendees.find((item) => item.id === attendeeId);
            const last = messages[messages.length - 1];
            if (!person || !last) return null;
            return (
              <PersonRow
                key={attendeeId}
                name={person.name}
                meta={last.text}
                href={{ pathname: "/chat/[id]", params: { id: attendeeId } }}
              />
            );
          })}
        </>
      ) : null}
      <SectionLabel>{`${people.length} opted in`}</SectionLabel>
      <SearchField value={query} onChange={setQuery} placeholder="Search people, companies, interests" />
      {people.length === 0 ? (
        <EmptyState title="No one matches" body="The two people who opted out never appear here." />
      ) : (
        people.map((person) => (
          <PersonRow
            key={person.id}
            name={person.name}
            meta={`${person.title}, ${person.company}`}
            href={{ pathname: "/attendee/[id]", params: { id: person.id } }}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: pad,
    marginBottom: 8,
    padding: 16,
    gap: 12,
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
