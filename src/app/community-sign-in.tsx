import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAuth } from "@/community/auth";
import { CrystalMark } from "@/components/CrystalMark";
import { Glass } from "@/components/Glass";
import { shimmerStyle } from "@/components/gloss";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { backgrounds } from "@/components/backgrounds";
import { colors, fonts, pad } from "@/theme";

export default function SignInScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    try {
      setError(null);
      await auth.sendCode(email);
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send the code");
    }
  }

  async function verify() {
    try {
      setError(null);
      await auth.verifyCode(email, code);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That code was not accepted");
    }
  }

  return (
    <Screen edge="none" photo={backgrounds.signIn.day} night={backgrounds.signIn.night} phase={backgrounds.signIn.phase}>
      <StackHeader title="Sign in" />
      <Glass style={styles.pad}>
        <CrystalMark size="mark" />
        <T variant="title">Your email</T>
        <T variant="small">A 6-digit code, kept in this app.</T>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.inkSoft} style={styles.input} accessibilityLabel="Email" />
        <Pressable accessibilityRole="button" onPress={send} style={[styles.button, shimmerStyle()]}>
          <T variant="button" color={colors.ink}>Send code</T>
        </Pressable>
        {sent ? (
          <>
            <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="6-digit code" placeholderTextColor={colors.inkSoft} style={styles.input} accessibilityLabel="Email code" />
            <Pressable accessibilityRole="button" onPress={verify} style={styles.button}>
              <T variant="button" color={colors.ink}>Verify code</T>
            </Pressable>
          </>
        ) : null}
        {auth.userId && !auth.preview ? <T variant="meta">Signed in{auth.email ? ` as ${auth.email}` : ""}.</T> : null}
        {error ? <T variant="meta">{error}</T> : null}
      </Glass>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { marginTop: 48, marginHorizontal: 22, gap: 14 },
  input: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(11,27,43,0.28)", color: colors.ink, fontFamily: fonts.body, fontSize: 16, paddingVertical: 12 },
  button: { backgroundColor: colors.gold, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 16 },
});
