import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import {
  forum,
  formatLabel,
  pollForSession,
  roomById,
  sessionById,
  speakerById,
  trackById,
} from "@/content";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { CapacityMeter, EmptyState, PrimaryButton, SecondaryButton, SectionLabel } from "@/components/ui";
import { canSaveSeat } from "@/logic/seats";
import { deviceTimeZone, formatRange, sameClock } from "@/logic/time";
import { createId } from "@/logic/state";
import { useApp } from "@/store";
import { colors, fonts, pad } from "@/theme";
import { Icon } from "@/components/Icon";

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = sessionById(String(id));
  const { state, dispatch } = useApp();
  const [draft, setDraft] = useState("");
  if (!session) {
    return (
      <Screen edge="none" scroll={false}>
        <StackHeader title="Session" />
        <EmptyState title="Not on the program" body="This link does not match a session." />
      </Screen>
    );
  }

  const localZone = deviceTimeZone();
  const room = roomById(session.roomId);
  const track = trackById(session.trackId);
  const day = forum.days.find((item) => item.id === session.dayId);
  const favored = state.favoriteIds.includes(session.id);
  const held = state.heldSeatIds.includes(session.id);
  const same = sameClock(session.start, forum.timezone, localZone);
  const poll = pollForSession(session.id);
  const vote = poll ? state.pollVotes[poll.id] : undefined;
  const questions = state.questions.filter((question) => question.sessionId === session.id);
  const open = canSaveSeat(session, held);

  return (
    <Screen edge="none">
      <StackHeader
        title={day ? `${day.weekday}` : "Session"}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={favored ? "Remove from favorites" : "Save to favorites"}
            onPress={() => dispatch({ type: "toggleFavorite", id: session.id })}
            style={styles.iconButton}
          >
            <Icon name={favored ? "heartFill" : "heart"} color={favored ? colors.clay : colors.ink} />
          </Pressable>
        }
      />
      <View style={styles.body}>
        <T variant="eyebrow" color={track?.color}>
          {formatLabel[session.format]}
          {track ? ` · ${track.name}` : ""}
        </T>
        <T variant="title" style={styles.title}>
          {session.title}
        </T>
        <T variant="small">{formatRange(session.start, session.end, forum.timezone)}</T>
        <T variant="meta" color={colors.brass}>
          {same ? "Pacific time, same as this phone." : `${formatRange(session.start, session.end, localZone)} · your time`}
        </T>
        {room ? (
          <Link href={{ pathname: "/venue", params: { room: room.id } }} asChild>
            <Pressable>
              <T variant="small" style={styles.room}>
                {room.name} · {room.floor}
              </T>
            </Pressable>
          </Link>
        ) : null}
        <T variant="body" style={styles.summary}>
          {session.summary}
        </T>
        {session.reservable ? (
          <View style={styles.seat}>
            <CapacityMeter session={session} held={held} />
            {held ? (
              <SecondaryButton label="Release seat" onPress={() => dispatch({ type: "toggleSeat", session })} />
            ) : (
              <PrimaryButton
                label={open ? "Save a seat" : "No seats left"}
                disabled={!open}
                onPress={() => dispatch({ type: "toggleSeat", session })}
              />
            )}
          </View>
        ) : (
          <T variant="meta">This one does not take a seat hold. Favorite it if you want it on My Schedule.</T>
        )}
      </View>

      {session.speakerIds.length > 0 ? (
        <>
          <SectionLabel>With</SectionLabel>
          {session.speakerIds.map((speakerId) => {
            const speaker = speakerById(speakerId);
            if (!speaker) return null;
            return (
              <Link key={speaker.id} href={{ pathname: "/speaker/[id]", params: { id: speaker.id } }} asChild>
                <Pressable style={styles.person}>
                  <T variant="rowTitle">{speaker.name}</T>
                  <T variant="meta">
                    {speaker.title}, {speaker.company}
                  </T>
                </Pressable>
              </Link>
            );
          })}
        </>
      ) : null}

      {poll ? (
        <View style={styles.block}>
          <T variant="eyebrow">Poll</T>
          <T variant="headline" style={styles.pollQuestion}>
            {poll.question}
          </T>
          <T variant="meta">Your vote stays on this device. There is no live tally.</T>
          {poll.options.map((option) => {
            const selected = vote === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => dispatch({ type: "vote", pollId: poll.id, optionId: option.id })}
                style={[styles.option, selected && styles.optionOn]}
              >
                <T variant="small" color={selected ? colors.ivory : colors.ink}>
                  {option.label}
                </T>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.block}>
        <T variant="eyebrow">Question</T>
        <T variant="meta">Saved on this device. A live room is not connected.</T>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask something of the room"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          multiline
        />
        <PrimaryButton
          label="Save question"
          disabled={!draft.trim()}
          onPress={() => {
            const text = draft.trim();
            if (!text) return;
            dispatch({
              type: "askQuestion",
              question: { id: createId("q"), sessionId: session.id, text, at: new Date().toISOString() },
            });
            setDraft("");
          }}
        />
        {questions.map((question) => (
          <T key={question.id} variant="small" style={styles.savedQuestion}>
            {question.text}
          </T>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: pad, gap: 8, paddingBottom: 8 },
  title: { marginTop: 4 },
  room: { textDecorationLine: "underline" },
  summary: { marginTop: 8 },
  seat: { marginTop: 12, gap: 12 },
  person: {
    paddingHorizontal: pad,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: 2,
  },
  block: { paddingHorizontal: pad, paddingTop: 22, gap: 10 },
  pollQuestion: { fontSize: 22, lineHeight: 26 },
  option: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 4,
  },
  optionOn: { backgroundColor: colors.pine, borderColor: colors.pine },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    textAlignVertical: "top",
  },
  savedQuestion: { paddingTop: 4 },
});
