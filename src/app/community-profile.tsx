import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAuth } from "@/community/auth";
import { saveProfile, uploadCommunityImage } from "@/community/live";
import { pickCommunityPhoto } from "@/community/photo";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { colors, fonts, pad } from "@/theme";

export default function ProfileScreen() {
  const auth = useAuth();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [note, setNote] = useState<string | null>(null);

  return (
    <Screen edge="none">
      <StackHeader title="Profile" />
      <View style={styles.pad}>
        <T variant="small">Display name, an optional photo, and an optional title and company.</T>
        <Pressable accessibilityRole="button" onPress={() => {
          pickCommunityPhoto().then(async (picked) => {
            if (!picked) return;
            if (!auth.userId || auth.preview) {
              setNote(auth.preview ? "Avatar upload runs after the media bucket is applied." : "Sign in first.");
              return;
            }
            const avatarUrl = await uploadCommunityImage(auth.userId, picked.file, picked.extension);
            await saveProfile(auth.userId, { displayName: name || "Member", title, company, avatarUrl });
            setNote("Avatar saved.");
          }).catch((cause) => setNote(cause instanceof Error ? cause.message : "Could not save the photo"));
        }}>
          <T variant="meta">Add photo</T>
        </Pressable>
        <Field label="Display name" value={name} onChangeText={setName} />
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Company" value={company} onChangeText={setCompany} />
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => {
          if (!auth.userId || auth.preview) {
            setNote(auth.preview ? "Preview profile stays on this screen." : "Sign in first.");
            return;
          }
          saveProfile(auth.userId, { displayName: name, title, company })
            .then(() => setNote("Saved."))
            .catch((cause) => setNote(cause instanceof Error ? cause.message : "Could not save"));
        }}>
          <T variant="button" color={colors.ivory}>Save profile</T>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => auth.signOut()}>
          <T variant="meta">Sign out</T>
        </Pressable>
        {note ? <T variant="meta">{note}</T> : null}
      </View>
    </Screen>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <T variant="meta">{label}</T>
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} accessibilityLabel={label} placeholderTextColor={colors.inkSoft} />
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: pad, gap: 12 },
  field: { gap: 4 },
  input: { borderWidth: 1, borderColor: colors.line, color: colors.ink, fontFamily: fonts.body, fontSize: 16, padding: 12 },
  button: { backgroundColor: colors.ink, minHeight: 48, alignItems: "center", justifyContent: "center" },
});
