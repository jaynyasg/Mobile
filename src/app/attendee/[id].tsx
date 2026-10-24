import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { attendeeById, forum, meetingSlots, sessions } from "@/content";
import { Monogram } from "@/components/Monogram";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { EmptyState, PrimaryButton } from "@/components/ui";
import { evaluateMeeting } from "@/logic/meetings";
import { formatRange } from "@/logic/time";
import { createId } from "@/logic/state";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";

export default function AttendeeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const person = attendeeById(String(id));
  const { state, dispatch } = useApp();
  const [notice, setNotice] = useState("");

  if (!person || !person.networkingOptIn) {
    return (
      <Screen edge="none" scroll={false}>
        <StackHeader title="Directory" />
        <EmptyState title="Not in the directory" body="This person has not opted in, or the link is wrong." />
      </Screen>
    );
  }

  return (
    <Screen edge="none">
      <StackHeader title="Directory" />
      <View style={styles.body}>
        <Monogram name={person.name} size={72} />
        <T variant="title">{person.name}</T>
        <T variant="small">
          {person.title}, {person.company}
        </T>
        <T variant="body">{person.bio}</T>
        <View style={styles.interests}>
          {person.interests.map((interest) => (
            <View key={interest} style={styles.interest}>
              <T variant="meta">{interest}</T>
            </View>
          ))}
        </View>
        {state.networkingOptIn ? (
          <Link href={{ pathname: "/chat/[id]", params: { id: person.id } }} asChild>
            <Pressable style={styles.message}>
              <T variant="button" color={colors.ivory}>
                Message
              </T>
            </Pressable>
          </Link>
        ) : (
          <PrimaryButton label="Join the directory to message" onPress={() => dispatch({ type: "setNetworkingOptIn", value: true })} />
        )}
        <T variant="eyebrow" style={styles.meetLabel}>
          Request a meeting
        </T>
        <T variant="meta">Requests pause when the time overlaps a keynote. Nothing is sent to a server.</T>
        {meetingSlots.map((slot) => {
          const decision = evaluateMeeting(slot, sessions);
          const requested = state.meetingRequests.some(
            (request) => request.attendeeId === person.id && request.slotId === slot.id,
          );
          const label = `${slot.weekday} · ${formatRange(slot.start, slot.end, forum.timezone)}`;
          return (
            <View key={slot.id} style={styles.slot}>
              <T variant="small">{label}</T>
              {!decision.ok ? <T variant="meta" color={colors.clay}>{decision.reason}</T> : null}
              {state.networkingOptIn ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={!decision.ok || requested}
                  onPress={() => {
                    if (!decision.ok) {
                      setNotice(decision.reason);
                      return;
                    }
                    dispatch({
                      type: "requestMeeting",
                      request: {
                        id: createId("meet"),
                        attendeeId: person.id,
                        slotId: slot.id,
                        createdAt: new Date().toISOString(),
                      },
                    });
                    setNotice("Request saved on this device.");
                  }}
                  style={[styles.slotButton, (!decision.ok || requested) && styles.slotOff]}
                >
                  <T variant="button" color={!decision.ok || requested ? colors.inkSoft : colors.ivory}>
                    {requested ? "Requested" : decision.ok ? "Request this time" : "Paused for a keynote"}
                  </T>
                </Pressable>
              ) : null}
            </View>
          );
        })}
        {!state.networkingOptIn ? (
          <T variant="meta">Join the directory before requesting a time.</T>
        ) : null}
        {notice ? <T variant="small">{notice}</T> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: pad, gap: 10 },
  interests: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interest: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  message: {
    minHeight: 48,
    backgroundColor: colors.pine,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  meetLabel: { marginTop: 12 },
  slot: { gap: 6, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  slotButton: {
    minHeight: 42,
    backgroundColor: colors.pine,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  slotOff: { backgroundColor: colors.line },
});
