import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAuth } from "@/community/auth";
import { loadProfile, saveProfile, uploadCommunityImage } from "@/community/live";
import { compressCommunityPhoto, pickCommunityPhoto } from "@/community/photo";
import { CommunityAvatar } from "@/components/CommunityAvatar";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { backgrounds } from "@/components/backgrounds";
import { colors, fonts } from "@/theme";
import { nightGlass } from "@/components/nightGlass";

export default function ProfileScreen() {
  const auth = useAuth();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.userId || auth.preview) return;
    loadProfile(auth.userId).then((profile) => {
      if (!profile) return;
      setName(profile.displayName);
      setTitle(profile.title ?? "");
      setCompany(profile.company ?? "");
      setBio(profile.bio ?? "");
      setLink(profile.link ?? "");
      setAvatarUrl(profile.avatarUrl);
    }).catch((cause) => setNote(cause instanceof Error ? cause.message : "Could not load the profile"));
  }, [auth.preview, auth.userId]);

  async function save(nextAvatar = avatarUrl) {
    if (!auth.userId || auth.preview) {
      setNote(auth.preview ? "Preview profile stays on this screen." : "Sign in first.");
      return;
    }
    await saveProfile(auth.userId, { displayName: name || "Member", title, company, bio, link, avatarUrl: nextAvatar });
    setNote("Saved.");
  }

  return (
    <Screen edge="none" photo={backgrounds.community.day} night={backgrounds.community.night} phase="profile">
      <StackHeader title="Profile" />
      <View style={styles.pad}>
        <T variant="small">Your name, a short bio, and an optional title, company, and link.</T>
        <View style={styles.avatarRow}>
          <CommunityAvatar name={name || "You"} url={avatarUrl} size={84} />
          <Pressable accessibilityRole="button" accessibilityLabel="Add profile photo" onPress={() => {
            pickCommunityPhoto().then(async (picked) => {
              if (!picked || !auth.userId || auth.preview) {
                setNote(auth.preview ? "Avatar upload runs after the media bucket is applied." : picked ? "Sign in first." : null);
                return;
              }
              const compact = await compressCommunityPhoto(picked.file);
              const next = await uploadCommunityImage(auth.userId, compact.file, compact.extension);
              setAvatarUrl(next);
              await save(next);
              setNote("Photo saved.");
            }).catch((cause) => setNote(cause instanceof Error ? cause.message : "Could not save the photo"));
          }} style={styles.photoButton}>
            <T variant="meta" color={colors.gold}>Add photo</T>
          </Pressable>
        </View>
        <Field label="Display name" value={name} onChangeText={setName} />
        <Field label="Bio" value={bio} onChangeText={setBio} />
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Company" value={company} onChangeText={setCompany} />
        <Field label="Link" value={link} onChangeText={setLink} />
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => save().catch((cause) => setNote(cause instanceof Error ? cause.message : "Could not save"))}>
          <T variant="button" color={colors.ink}>Save profile</T>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => auth.signOut()}>
          <T variant="meta" color={colors.gold}>Sign out</T>
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
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} accessibilityLabel={label} placeholderTextColor="rgba(245,241,232,0.62)" />
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { marginHorizontal: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderRadius: 18, ...nightGlass },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  photoButton: { minHeight: 44, justifyContent: "center" },
  field: { gap: 4 },
  input: { borderWidth: 1, borderColor: "rgba(255,224,138,0.42)", backgroundColor: "rgba(7,27,42,0.62)", color: colors.foam, fontFamily: fonts.body, fontSize: 16, padding: 12 },
  button: { backgroundColor: colors.gold, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 16 },
});
