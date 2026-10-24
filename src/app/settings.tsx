import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Switch, TextInput, View } from "react-native";
import { forum } from "@/content";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { useApp } from "@/store";
import { colors, fonts, pad } from "@/theme";

export default function SettingsScreen() {
  const { state, dispatch } = useApp();
  const [notice, setNotice] = useState("");

  function confirmDelete() {
    const run = () => {
      dispatch({ type: "deleteAllData" });
      setNotice("Personal data on this device was deleted.");
    };
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Delete favorites, seats, messages, requests, votes, questions, and your profile from this device?")) {
        run();
      }
      return;
    }
    Alert.alert(
      "Delete data on this device?",
      "Favorites, seats, messages, meeting requests, votes, questions, your card, and your profile will be removed. The program stays.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: run },
      ],
    );
  }

  return (
    <Screen edge="none">
      <StackHeader title="Settings" />
      <View style={styles.body}>
        <T variant="eyebrow">Profile</T>
        <Field label="Name" value={state.profile.name} onChange={(name) => dispatch({ type: "updateProfile", patch: { name } })} />
        <Field label="Title" value={state.profile.title} onChange={(title) => dispatch({ type: "updateProfile", patch: { title } })} />
        <Field label="Company" value={state.profile.company} onChange={(company) => dispatch({ type: "updateProfile", patch: { company } })} />
        <Field
          label="Note"
          value={state.profile.bio}
          onChange={(bio) => dispatch({ type: "updateProfile", patch: { bio } })}
          multiline
        />
        <View style={styles.opt}>
          <View style={styles.optCopy}>
            <T variant="rowTitle">Networking</T>
            <T variant="meta">Opt in to message people and request meetings. The directory itself only lists people who opted in.</T>
          </View>
          <Switch
            accessibilityLabel="Opt in to networking"
            value={state.networkingOptIn}
            onValueChange={(value) => dispatch({ type: "setNetworkingOptIn", value })}
            trackColor={{ false: colors.line, true: colors.pine }}
            thumbColor={colors.ivory}
          />
        </View>
        <T variant="eyebrow" style={styles.block}>
          Release notes · {forum.releaseNotes.version}
        </T>
        <T variant="meta">{forum.releaseNotes.date}</T>
        {forum.releaseNotes.items.map((item) => (
          <T key={item} variant="small" style={styles.note}>
            {item}
          </T>
        ))}
        <T variant="eyebrow" style={styles.block}>
          About
        </T>
        <T variant="small">
          Portico Assembly is a fictional forum, written for this demo. It is not affiliated with any real event, venue, or company named here.
        </T>
        <T variant="eyebrow" style={styles.block}>
          Your data
        </T>
        <T variant="small">
          Everything you save — favorites, seats, messages, meeting requests, poll votes, questions, sponsor cards, guide questions, and this profile — lives on this device. Deleting it does not touch the program.
        </T>
        <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.delete}>
          <T variant="button" color={colors.clay}>
            Delete my data
          </T>
        </Pressable>
        {notice ? <T variant="small">{notice}</T> : null}
      </View>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <T variant="eyebrow">{label}</T>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor={colors.inkSoft}
        style={[styles.input, multiline && styles.multiline]}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: pad, gap: 10, paddingBottom: 12 },
  field: { gap: 4 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 8,
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  opt: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 8 },
  optCopy: { flex: 1, gap: 4 },
  block: { marginTop: 18 },
  note: { paddingLeft: 2 },
  delete: { minHeight: 48, justifyContent: "center" },
});
