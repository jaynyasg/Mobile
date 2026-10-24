import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { forum } from "@/content";
import { QrMark } from "@/components/QrMark";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { PASS_ID, PASS_PAYLOAD } from "@/logic/state";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";

export default function TicketScreen() {
  const { state } = useApp();
  const name = state.profile.name.trim() || "Guest";
  const line = [state.profile.title, state.profile.company].filter(Boolean).join(", ");
  return (
    <Screen edge="none">
      <StackHeader title="Badge" />
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Image source={require("../../assets/images/icon.png")} style={styles.seal} />
          <T variant="eyebrow">Portico</T>
          <T variant="title">Assembly pass</T>
          <T variant="headline" style={styles.name}>
            {name}
          </T>
          {line ? <T variant="small">{line}</T> : null}
          {!state.profile.name.trim() ? (
            <Link href="/settings">
              <T variant="small" color={colors.brass}>
                Add your name in Settings
              </T>
            </Link>
          ) : null}
          <View style={styles.qr}>
            <QrMark value={PASS_PAYLOAD} />
          </View>
          <T variant="eyebrow">{PASS_ID}</T>
          <T variant="meta" style={styles.meta}>
            {forum.venue.name}
            {"\n"}
            {forum.dateLabel}
            {"\n"}
            Admit one
          </T>
        </View>
        <T variant="meta" style={styles.note}>
          Sample pass for this demo. The mark encodes {PASS_PAYLOAD}. Nothing is checked against a server.
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: pad, gap: 16 },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    padding: 22,
    alignItems: "center",
    gap: 6,
  },
  seal: { width: 56, height: 56, borderRadius: 8, marginBottom: 8 },
  name: { marginTop: 8, textAlign: "center" },
  qr: { marginVertical: 12 },
  meta: { textAlign: "center", marginTop: 8 },
  note: { textAlign: "center" },
});
