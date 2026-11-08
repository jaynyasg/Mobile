import { Pressable, StyleSheet, View } from "react-native";
import { notifications } from "@/content";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { formatStamp } from "@/logic/time";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";
import { forum } from "@/content";

export default function NotificationsScreen() {
  const { state, dispatch } = useApp();
  return (
    <Screen edge="none">
      <StackHeader title="Notifications" />
      <View style={styles.pad}>
        <T variant="meta">These notes are copied from the source draft. They are not push messages.</T>
        <Pressable
          accessibilityRole="button"
          onPress={() => dispatch({ type: "markAllNotificationsRead", ids: notifications.map((note) => note.id) })}
        >
          <T variant="small" color={colors.brass}>
            Mark all read
          </T>
        </Pressable>
      </View>
      {notifications.map((note) => {
        const read = state.readNotificationIds.includes(note.id);
        return (
          <Pressable
            key={note.id}
            accessibilityRole="button"
            onPress={() => dispatch({ type: "markNotificationRead", id: note.id })}
            style={[styles.note, !read && styles.unread]}
          >
            <T variant="rowTitle">{note.title}</T>
            <T variant="small">{note.body}</T>
            <T variant="meta">{formatStamp(note.sentAt, forum.timezone)}</T>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: pad, gap: 8 },
  note: { marginHorizontal: pad, marginBottom: 8, padding: 12, gap: 6, borderWidth: 1, borderColor: colors.line },
  unread: { borderColor: colors.brassSoft },
});
