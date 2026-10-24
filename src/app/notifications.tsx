import { Pressable, StyleSheet, View } from "react-native";
import { forum, notifications } from "@/content";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { formatStamp } from "@/logic/time";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";

export default function NotificationsScreen() {
  const { state, dispatch } = useApp();
  const notes = [...notifications].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  const unread = notes.filter((note) => !state.readNotificationIds.includes(note.id)).length;
  return (
    <Screen edge="none">
      <StackHeader
        title="Notifications"
        right={
          unread > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => dispatch({ type: "markAllNotificationsRead", ids: notes.map((note) => note.id) })}
            >
              <T variant="button" color={colors.brass}>
                Mark all
              </T>
            </Pressable>
          ) : (
            <View style={styles.spacer} />
          )
        }
      />
      <T variant="meta" style={styles.intro}>
        A sample inbox. These notes are part of the program, not push messages.
      </T>
      {notes.map((note) => {
        const read = state.readNotificationIds.includes(note.id);
        return (
          <Pressable
            key={note.id}
            accessibilityRole="button"
            onPress={() => dispatch({ type: "markNotificationRead", id: note.id })}
            style={styles.row}
          >
            <View style={styles.top}>
              {!read ? <View style={styles.dot} /> : <View style={styles.dotOff} />}
              <T variant="meta">{formatStamp(note.sentAt, forum.timezone)}</T>
            </View>
            <T variant="rowTitle">{note.title}</T>
            <T variant="small">{note.body}</T>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacer: { width: 36 },
  intro: { paddingHorizontal: pad, marginBottom: 8 },
  row: {
    paddingHorizontal: pad,
    paddingVertical: 14,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brass },
  dotOff: { width: 8, height: 8 },
});
