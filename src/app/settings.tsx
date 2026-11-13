import { useState } from "react";
import { Alert, Platform, StyleSheet, TextInput, View } from "react-native";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { useApp } from "@/store";
import { colors, fonts, pad } from "@/theme";
import { nightGlass } from "@/components/nightGlass";

export default function SettingsScreen() {
  const { state, dispatch } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);

  function erase() {
    dispatch({ type: "deleteAllData" });
    setConfirming(false);
    setCleared(true);
  }

  function ask() {
    const message = "Delete favorites, messages, guide history, notification reads, your opt-in, and your profile from this device?";
    if (Platform.OS === "web") {
      if (window.confirm(message)) erase();
      return;
    }
    Alert.alert("Delete my data", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: erase },
    ]);
  }

  return (
    <Screen edge="none">
      <StackHeader title="Settings" />
      <View style={styles.pad}>
        <T variant="eyebrow">Local profile</T>
        <T variant="meta">This card stays on the device. It is not sent to a panelist or a provider.</T>
        <Field label="Name" value={state.profile.name} onChangeText={(name) => dispatch({ type: "updateProfile", patch: { name } })} />
        <Field label="Title" value={state.profile.title} onChangeText={(title) => dispatch({ type: "updateProfile", patch: { title } })} />
        <Field label="Company" value={state.profile.company} onChangeText={(company) => dispatch({ type: "updateProfile", patch: { company } })} />
        <T variant="eyebrow">Networking</T>
        {state.networkingOptIn ? (
          <SecondaryButton label="Opt out on this device" onPress={() => dispatch({ type: "setNetworkingOptIn", value: false })} />
        ) : (
          <PrimaryButton label="Opt in on this device" onPress={() => dispatch({ type: "setNetworkingOptIn", value: true })} />
        )}
        <T variant="eyebrow">Delete my data</T>
        <T variant="small">
          This removes favorites, local notes, guide history, notification reads, your opt-in, and your profile. The program draft remains.
        </T>
        {confirming ? (
          <PrimaryButton label="Confirm delete my data" onPress={ask} />
        ) : (
          <PressDelete onPress={() => setConfirming(true)} />
        )}
        {cleared ? <T variant="small">Personal data on this device was deleted.</T> : null}
      </View>
    </Screen>
  );
}

function PressDelete({ onPress }: { onPress: () => void }) {
  return <SecondaryButton label="Delete my data" onPress={onPress} />;
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <T variant="meta">{label}</T>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholderTextColor="rgba(245,241,232,0.62)"
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { marginHorizontal: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderRadius: 18, ...nightGlass },
  field: { gap: 4 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.42)",
    backgroundColor: "rgba(7,27,42,0.62)",
    color: colors.foam,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
