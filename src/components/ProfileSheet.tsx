import { Linking, Pressable, StyleSheet, View } from "react-native";
import type { CommunityProfile } from "@/community/types";
import { colors } from "@/theme";
import { CommunityAvatar } from "./CommunityAvatar";
import { T } from "./Text";

export function ProfileSheet({ profile, onClose }: { profile: CommunityProfile | null; onClose: () => void }) {
  if (!profile) return null;
  const role = [profile.title, profile.company].filter(Boolean).join(" · ");
  return (
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close profile" style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        <CommunityAvatar name={profile.displayName} url={profile.avatarUrl} size={96} />
        <T variant="title">{profile.displayName}</T>
        {role ? <T variant="meta" color={colors.gold}>{role}</T> : null}
        {profile.bio ? <T variant="body">{profile.bio}</T> : null}
        {profile.link ? (
          <Pressable accessibilityRole="link" accessibilityLabel={profile.link} onPress={() => Linking.openURL(profile.link!)}>
            <T variant="small" color={colors.gold}>{profile.link.replace(/^https?:\/\//, "")}</T>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}>
          <T variant="button" color={colors.ink}>Close</T>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(6,14,24,0.45)" },
  card: {
    margin: 12,
    marginBottom: 28,
    padding: 18,
    gap: 8,
    borderRadius: 22,
    alignItems: "flex-start",
    backgroundColor: "rgba(7,27,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.48)",
  },
  close: { alignSelf: "stretch", marginTop: 8, minHeight: 48, borderRadius: 16, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
});
