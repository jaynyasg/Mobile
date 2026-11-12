import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useContent } from "@/content/provider";
import { QrMark } from "@/components/QrMark";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { passPayload } from "@/logic/state";
import { colors, pad } from "@/theme";

export default function TicketScreen() {
  const { program } = useContent();
  const { passes } = program;
  const [passId, setPassId] = useState(passes.items[0].id);
  const pass = passes.items.find((item) => item.id === passId) ?? passes.items[0];

  return (
    <Screen edge="none">
      <StackHeader title="Pass preview" />
      <View style={styles.pad}>
        <T variant="eyebrow">{passes.previewLabel}</T>
        <T variant="title">Find your passage</T>
        <T variant="meta">{passes.legend}</T>
        <T variant="small">{passes.sourceNote}</T>
      </View>
      {passes.items.map((item) => {
        const selected = item.id === pass.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setPassId(item.id)}
            style={[styles.pass, selected && styles.passOn]}
          >
            <T variant="rowTitle">{item.name}</T>
            <T variant="small">
              {item.price} {item.unit}
            </T>
            {item.minimum ? <T variant="meta">{item.minimum}</T> : null}
            {item.paragraphs.map((paragraph) => (
              <T key={paragraph} variant="meta">
                {paragraph}
              </T>
            ))}
            {item.bullets.map((bullet) => (
              <T key={bullet} variant="meta">
                · {bullet}
              </T>
            ))}
          </Pressable>
        );
      })}
      <View style={styles.qr}>
        <QrMark value={passPayload(pass.id)} />
        <T variant="meta">This code marks a design preview. It is not a ticket and it does not reserve a place.</T>
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(passes.sourceUrl).catch(() => undefined)}>
          <T variant="small" color={colors.brass}>
            View original pass information
          </T>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { marginHorizontal: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8, borderRadius: 18, backgroundColor: "rgba(247,244,239,0.96)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(11,27,43,0.12)" },
  pass: { marginHorizontal: 12, marginBottom: 8, padding: 14, gap: 6, minHeight: 44, borderRadius: 16, borderWidth: 1, borderColor: "rgba(11,27,43,0.12)", backgroundColor: "rgba(247,244,239,0.96)" },
  passOn: { borderColor: colors.brass, backgroundColor: "#F8F1D8" },
  qr: { alignItems: "center", gap: 12, marginHorizontal: 12, marginBottom: 12, padding: 16, borderRadius: 18, backgroundColor: "rgba(247,244,239,0.96)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(11,27,43,0.12)" },
});
