import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { essentials } from "@/guide/essentials";
import { addStamp, knowStamp, prefersReducedMotion, pulse } from "@/guide/stamps";
import { localReelStore } from "@/reels/gate";
import { colors } from "@/theme";
import { nightGlass } from "@/components/nightGlass";

export default function KnowScreen() {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <Screen edge="none">
      <StackHeader title="Need to know" />
      <T variant="small" style={styles.lead}>Short notes before you travel. Open one for the source.</T>
      {essentials.map((item) => {
        const open = openId === item.id;
        return (
          <View key={item.id} style={[styles.card, nightGlass]}>
            <T variant="rowTitle" color={colors.foam}>{item.title}</T>
            <T variant="small" color={colors.foam}>{item.line}</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={open ? `Hide ${item.title}` : `More on ${item.title}`}
              onPress={() => {
                if (!open && addStamp(localReelStore(), knowStamp(item.id))) pulse(prefersReducedMotion());
                setOpenId(open ? null : item.id);
              }}
              style={styles.more}
            >
              <T variant="button" color={colors.ink}>{open ? "Hide" : "More"}</T>
            </Pressable>
            {open ? <T variant="meta" color={colors.foam}>{item.more}</T> : null}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginHorizontal: 20, marginBottom: 8 },
  card: { marginHorizontal: 16, marginBottom: 10, padding: 14, gap: 6, borderRadius: 18 },
  more: { alignSelf: "flex-start", minHeight: 40, marginTop: 4, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
