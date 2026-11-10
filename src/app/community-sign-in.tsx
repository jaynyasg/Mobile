import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAuth } from "@/community/auth";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
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
    <Screen edge="none">
      <StackHeader title="Sign in" />
      <View style={styles.pad}>
        <T variant="title">Your email</T>
        <T variant="small">We send a 6-digit code. It stays in this installed app. No link to tap.</T>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.inkSoft} style={styles.input} accessibilityLabel="Email" />
        <Pressable accessibilityRole="button" onPress={send} style={styles.button}>
          <T variant="button" color={colors.ivory}>Send code</T>
        </Pressable>
        {sent ? (
          <>
            <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="6-digit code" placeholderTextColor={colors.inkSoft} style={styles.input} accessibilityLabel="Email code" />
            <Pressable accessibilityRole="button" onPress={verify} style={styles.button}>
              <T variant="button" color={colors.ivory}>Verify code</T>
            </Pressable>
          </>
        ) : null}
        {auth.userId && !auth.preview ? <T variant="meta">Signed in{auth.email ? ` as ${auth.email}` : ""}.</T> : null}
        {error ? <T variant="meta">{error}</T> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: pad, gap: 12 },
  input: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperRaised, color: colors.ink, fontFamily: fonts.body, fontSize: 16, padding: 12 },
  button: { backgroundColor: colors.ink, minHeight: 48, alignItems: "center", justifyContent: "center" },
});
