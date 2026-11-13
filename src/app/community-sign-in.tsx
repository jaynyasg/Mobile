import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/community/auth";
import { CrystalMark } from "@/components/CrystalMark";
import { Glass } from "@/components/Glass";
import { shimmerStyle } from "@/components/gloss";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { backgrounds } from "@/components/backgrounds";
import { stageSignInPhone } from "@/logic/contactPrefs";
import { DIAL_COUNTRIES, DEFAULT_COUNTRY_ID, countryById } from "@/logic/phone";
import {
  SMS_ENABLED,
  SMS_UNAVAILABLE_MESSAGE,
  errorText,
  isSixDigitCode,
  shouldFallBackFromText,
  signInFields,
  startEmailSignIn,
  startPhoneSignIn,
  type SignInChannel,
} from "@/logic/signIn";
import { webStorage } from "@/welcome";
import { colors, fonts } from "@/theme";

export default function SignInScreen() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [national, setNational] = useState("");
  const [countryId, setCountryId] = useState(DEFAULT_COUNTRY_ID);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [channel, setChannel] = useState<SignInChannel>("email");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "code">("form");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const country = countryById(countryId);

  async function finish(phone: string) {
    await auth.savePhone(phone);
    router.replace("/community");
  }

  async function sendEmail() {
    const fields = signInFields(email, countryId, national);
    if ("error" in fields) {
      setError(fields.error);
      return;
    }
    setBusy(true);
    setError(null);
    stageSignInPhone(webStorage(), fields.phone);
    try {
      const result = await startEmailSignIn(
        { quickSignIn: auth.quickSignIn, sendEmailCode: auth.sendCode },
        fields.email,
      );
      if (result === "session") {
        await finish(fields.phone);
        return;
      }
      setChannel("email");
      setSentTo(fields.email);
      setCode("");
      setStep("code");
    } catch (cause) {
      setError(errorText(cause) || "Could not send the code");
    } finally {
      setBusy(false);
    }
  }

  async function sendText() {
    const fields = signInFields(email, countryId, national);
    if ("error" in fields) {
      setError(fields.error);
      return;
    }
    setBusy(true);
    setError(null);
    stageSignInPhone(webStorage(), fields.phone);
    try {
      const result = await startPhoneSignIn({ sendPhoneCode: auth.sendPhoneCode }, fields.phone);
      if (result === "sms-unavailable") {
        setError(SMS_UNAVAILABLE_MESSAGE);
        return;
      }
      setChannel("sms");
      setSentTo(fields.phone);
      setCode("");
      setStep("code");
    } catch (cause) {
      setError(errorText(cause) || "Could not send the code");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!isSixDigitCode(code)) {
      setError("Enter the 6-digit code.");
      return;
    }
    const fields = signInFields(email, countryId, national);
    if ("error" in fields) {
      setError(fields.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (channel === "sms") await auth.verifyPhoneCode(fields.email, code);
      else await auth.verifyCode(fields.email, code);
      await finish(fields.phone);
    } catch (cause) {
      if (channel === "sms" && shouldFallBackFromText(cause)) {
        setStep("form");
        setError(SMS_UNAVAILABLE_MESSAGE);
        return;
      }
      setError(errorText(cause) || "That code was not accepted");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edge="none" photo={backgrounds.signIn.day} night={backgrounds.signIn.night} phase={backgrounds.signIn.phase}>
      <StackHeader title="Sign in" />
      <Glass tone="dark" style={styles.pad}>
        <CrystalMark size="mark" />
        {step === "form" ? (
          <>
            <T variant="title">Email and phone</T>
            <T variant="small">Both are required. Most addresses get a 6-digit code.</T>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="rgba(245,241,232,0.62)"
              style={styles.input}
              accessibilityLabel="Email"
            />
            <View style={styles.phoneRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Country"
                onPress={() => setPickerOpen((open) => !open)}
                style={styles.country}
              >
                <T variant="meta" color={colors.foam}>{country.name} +{country.dial}</T>
              </Pressable>
              <TextInput
                value={national}
                onChangeText={setNational}
                keyboardType="phone-pad"
                placeholder="340 555 0100"
                placeholderTextColor="rgba(245,241,232,0.62)"
                style={[styles.input, styles.phoneInput]}
                accessibilityLabel="Phone"
              />
            </View>
            {pickerOpen ? (
              <View style={styles.countries}>
                {DIAL_COUNTRIES.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name} +${item.dial}`}
                    onPress={() => {
                      setCountryId(item.id);
                      setPickerOpen(false);
                    }}
                    style={styles.countryRow}
                  >
                    <T variant="meta" color={item.id === countryId ? colors.gold : colors.foam}>{item.name} +{item.dial}</T>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {SMS_ENABLED ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Text me a code" disabled={busy} onPress={sendText} style={styles.secondary}>
                <T variant="button" color={colors.gold}>Text me a code</T>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Email me a code" disabled={busy} onPress={sendEmail} style={[styles.button, shimmerStyle()]}>
              <T variant="button" color={colors.ink}>Email me a code</T>
            </Pressable>
          </>
        ) : (
          <>
            <T variant="title">6-digit code</T>
            <T variant="small">Enter the code sent to {sentTo}.</T>
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="6-digit code"
              placeholderTextColor="rgba(245,241,232,0.62)"
              style={styles.input}
              accessibilityLabel={channel === "sms" ? "Text code" : "Email code"}
              maxLength={6}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Verify code" disabled={busy} onPress={verify} style={[styles.button, shimmerStyle()]}>
              <T variant="button" color={colors.ink}>Verify code</T>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => { setStep("form"); setError(null); }} style={styles.back}>
              <T variant="button" color={colors.gold}>Back</T>
            </Pressable>
          </>
        )}
        {error ? <T variant="meta">{error}</T> : null}
      </Glass>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { marginTop: 28, marginHorizontal: 22, gap: 14 },
  input: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,224,138,0.42)",
    color: colors.foam,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  phoneRow: { gap: 8 },
  phoneInput: { flex: 1 },
  country: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.42)",
    backgroundColor: "rgba(7,27,42,0.72)",
  },
  countries: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.42)",
    backgroundColor: "rgba(7,27,42,0.92)",
    overflow: "hidden",
  },
  countryRow: { minHeight: 42, justifyContent: "center", paddingHorizontal: 12 },
  button: { backgroundColor: colors.gold, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  secondary: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.55)",
    backgroundColor: "rgba(7,27,42,0.72)",
  },
  back: { minHeight: 44, alignItems: "center", justifyContent: "center" },
});
