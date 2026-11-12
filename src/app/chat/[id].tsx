import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { panelistById } from "@/content";
import { useContent } from "@/content/provider";
import { ChatImages } from "@/components/ChatImages";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { createId } from "@/logic/state";
import { useApp } from "@/store";
import { colors, fonts, pad } from "@/theme";

const LOCAL_NOTE = "Not sent. This note stays on this device and is not a message from the panelist.";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useContent();
  const person = panelistById(id ?? "");
  const { state, dispatch } = useApp();
  const [draft, setDraft] = useState("");
  const thread = person ? (state.threads[person.id] ?? []) : [];

  function send() {
    if (!person || !state.networkingOptIn) return;
    const text = draft.trim();
    if (!text) return;
    const at = new Date().toISOString();
    dispatch({
      type: "sendMessage",
      panelistId: person.id,
      message: { id: createId("you"), from: "you", text, at },
    });
    dispatch({
      type: "sendMessage",
      panelistId: person.id,
      message: { id: createId("note"), from: "note", text: LOCAL_NOTE, at },
    });
    setDraft("");
  }

  if (!person) {
    return (
      <Screen edge="none">
        <StackHeader title="Note" />
        <T variant="body" style={{ padding: pad }}>This panelist is not on the roster.</T>
      </Screen>
    );
  }

  return (
    <Screen edge="none">
      <StackHeader title={person.name} />
      <View style={styles.pad}>
        <T variant="meta">
          {person.title} · {person.company}. A local note is not delivered and is not their words.
        </T>
        {!state.networkingOptIn ? <T variant="small">Opt in from Network before writing a note.</T> : null}
        {thread.map((message) => (
          <View key={message.id} style={styles.bubble}>
            <T variant="eyebrow">{message.from === "you" ? "You" : "This device"}</T>
            <T variant="small">{message.text}</T>
            <ChatImages text={message.text} label={message.from === "you" ? "Photo from you" : "Photo on this device"} />
          </View>
        ))}
        <TextInput
          value={draft}
          onChangeText={setDraft}
          editable={state.networkingOptIn}
          placeholder="Write a note that stays here"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          accessibilityLabel="Local note"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save note"
          disabled={!state.networkingOptIn}
          onPress={send}
          style={[styles.send, !state.networkingOptIn && styles.off]}
        >
          <T variant="button" color={colors.ivory}>
            Save on this device
          </T>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: pad, gap: 10 },
  bubble: { gap: 4, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 16,
    padding: 12,
    minHeight: 72,
  },
  send: { backgroundColor: colors.ink, minHeight: 48, alignItems: "center", justifyContent: "center" },
  off: { opacity: 0.35 },
});
