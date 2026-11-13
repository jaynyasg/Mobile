import { Pressable, StyleSheet, View } from "react-native";
import { forum } from "@/content";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { formatStamp } from "@/logic/time";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";
import { nightGlass } from "@/components/nightGlass";

export default function NotificationsScreen() {
  const { program } = useContent();
  const { notifications } = program;
  const { state, dispatch } = useApp();
  return (
    <Screen edge="none">
      <StackHeader title="Notifications" />
      <View style={styles.pad}>
        <T variant="meta">Summit notes saved on this device. They are not phone alerts.</T>
        <Pressable
          accessibilityRole="button"
          onPress={() => dispatch({ type: "markAllNotificationsRead", ids: notifications.map((note) => note.id) })}
        >
          <T variant="small" color={colors.gold}>
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
            <T variant="rowTitle" numberOfLines={3}>{note.title}</T>
            <T variant="small" numberOfLines={4}>{note.body}</T>
            <T variant="meta">{formatStamp(note.sentAt, forum.timezone)}</T>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { marginHorizontal: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8, borderRadius: 18, ...nightGlass },
  note: { marginHorizontal: 12, marginBottom: 8, padding: 14, gap: 6, minHeight: 44, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(11,27,43,0.12)", ...nightGlass },
  unread: { borderColor: colors.brassSoft },
});
