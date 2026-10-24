import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ScrollViewInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { attendeeById } from "@/content";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { EmptyState } from "@/components/ui";
import { createId } from "@/logic/state";
import { formatStamp } from "@/logic/time";
import { useApp } from "@/store";
import { colors, fonts, pad } from "@/theme";
import { Icon } from "@/components/Icon";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const person = attendeeById(String(id));
  const { state, dispatch } = useApp();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState("");
  const scroller = useRef<ScrollViewInstance>(null);
  const replied = useRef(false);
  const messages = person ? (state.threads[person.id] ?? []) : [];

  useEffect(() => {
    scroller.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  if (!person || !person.networkingOptIn) {
    return (
      <View style={styles.fill}>
        <StackHeader title="Message" />
        <EmptyState title="No conversation" body="This person is not in the directory." />
      </View>
    );
  }

  function send() {
    if (!person) return;
    const text = draft.trim();
    if (!text) return;
    if (!state.networkingOptIn) return;
    dispatch({
      type: "sendMessage",
      attendeeId: person.id,
      message: { id: createId("m"), from: "you", text, at: new Date().toISOString() },
    });
    setDraft("");
    if (replied.current || !person.reply) return;
    replied.current = true;
    const reply = person.reply;
    setTimeout(() => {
      dispatch({
        type: "sendMessage",
        attendeeId: person.id,
        message: { id: createId("r"), from: "them", text: reply, at: new Date().toISOString(), scripted: true },
      });
    }, 700);
  }

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StackHeader title={person.name} />
      {!state.networkingOptIn ? (
        <View style={styles.gate}>
          <T variant="meta">Join the directory before sending a message.</T>
          <Pressable style={styles.sendGate} onPress={() => dispatch({ type: "setNetworkingOptIn", value: true })}>
            <T variant="button" color={colors.ivory}>
              Join the directory
            </T>
          </Pressable>
        </View>
      ) : null}
      <ScrollView ref={scroller} contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled">
        {messages.map((message) => {
          const mine = message.from === "you";
          return (
            <View key={message.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <T variant="small" color={mine ? colors.ivory : colors.ink}>
                {message.text}
              </T>
              <T variant="meta" color={mine ? colors.brassSoft : colors.inkSoft} style={styles.when}>
                {formatStamp(message.at, forumZone())}
              </T>
            </View>
          );
        })}
      </ScrollView>
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={state.networkingOptIn ? `Message ${person.name.split(" ")[0]}` : "Join to message"}
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          editable={state.networkingOptIn}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          accessibilityState={{ disabled: !state.networkingOptIn }}
          disabled={!state.networkingOptIn}
          onPress={send}
          style={[styles.send, !state.networkingOptIn && styles.sendOff]}
        >
          <Icon name="send" color={colors.ivory} size={18} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function forumZone() {
  return "America/Los_Angeles";
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.paper },
  gate: { paddingHorizontal: pad, paddingBottom: 8, gap: 8 },
  sendGate: { backgroundColor: colors.pine, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 4 },
  thread: { paddingHorizontal: pad, paddingVertical: 12, gap: 10 },
  bubble: { maxWidth: "84%", padding: 12, borderRadius: 4, gap: 6 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.pine },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.line },
  when: { fontSize: 11, lineHeight: 14 },
  composer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: pad,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.paperRaised,
  },
  input: {
    flex: 1,
    minHeight: 44,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.pine,
    alignItems: "center",
    justifyContent: "center",
  },
  sendOff: { opacity: 0.35 },
});
