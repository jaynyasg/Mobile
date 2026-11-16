import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { essentials } from "@/guide/essentials";
import { colors } from "@/theme";
import { ExternalLink } from "@/components/ExternalLink";
import { BVI_ENTRY, OFFICIAL_BVI_FERRY_URL, OFFICIAL_USVI_FERRY_URL } from "@/logic/ferrySchedule";
import { FERRY_DOCKS, LOVANGO_FERRY_BOOK_URL } from "@/logic/ferryDocks";
import { StepBridge } from "@/components/StepBridge";
import { nightGlass } from "@/components/nightGlass";

export default function KnowScreen() {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <Screen edge="none">
      <StackHeader title="Preparation guide" />
      <StepBridge id="know" />
      <T variant="small" style={styles.lead}>What to have ready before you travel: documents, money, driving, and the border. You change islands only by boat. Be on the Beach is the public ferry, on a fixed schedule, and a taxi on land. Be on the Boat is a private charter for the day, leaving at set group times. Be on Board is the VIP charter you stay on for all 5 days, on your group's own schedule. St. Thomas to St. John times are on the official USVI ferry schedule. They can change. Check it before you travel.</T>
      <View style={[styles.card, nightGlass]}>
        <T variant="rowTitle" color={colors.foam}>Official USVI ferry schedule</T>
        <T variant="small" color={colors.foam}>Red Hook, Charlotte Amalie, and Cruz Bay. Effective November 1, 2026. Not a separate January 26–29, 2027 poster.</T>
        <ExternalLink href={OFFICIAL_USVI_FERRY_URL} label="Official USVI ferry schedule">Official USVI ferry schedule</ExternalLink>
      </View>
      <View style={[styles.card, nightGlass]}>
        <T variant="rowTitle" color={colors.foam}>Official BVI ferry schedules</T>
        <T variant="small" color={colors.foam}>Tortola, Virgin Gorda, Jost Van Dyke, and the boats from St. Thomas into the BVI. Subject to change. {BVI_ENTRY}</T>
        <ExternalLink href={OFFICIAL_BVI_FERRY_URL} label="Official BVI ferry schedules">Official BVI ferry schedules</ExternalLink>
      </View>
      <View style={[styles.card, nightGlass]}>
        <T variant="rowTitle" color={colors.foam}>Where to board</T>
        <T variant="small" color={colors.foam}>Public ferry docks with a pin. West End, Road Town, Spanish Town, Trellis Bay, and Scrub Island are on the schedules and are not pinned. Lovango’s St. Thomas boat uses the resort pier in Red Hook, not the public Red Hook ferry dock.</T>
        {FERRY_DOCKS.map((dock) => (
          <ExternalLink key={dock.id} href={dock.url} label={dock.name}>{dock.name}</ExternalLink>
        ))}
        <ExternalLink href={LOVANGO_FERRY_BOOK_URL} label="Book the Lovango ferry">Book the Lovango ferry</ExternalLink>
      </View>
      {essentials.map((item) => {
        const open = openId === item.id;
        return (
          <View key={item.id} style={[styles.card, nightGlass]}>
            <T variant="rowTitle" color={colors.foam} numberOfLines={3}>{item.title}</T>
            <T variant="small" color={colors.foam} numberOfLines={3}>{item.line}</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={open ? `Hide ${item.title}` : `More on ${item.title}`}
              onPress={() => setOpenId(open ? null : item.id)}
              style={styles.more}
            >
              <T variant="button" color={colors.ink}>{open ? "Hide" : "More"}</T>
            </Pressable>
            {open ? (
              <>
                <T variant="meta" color={colors.foam}>{item.more}</T>
                {item.sources.map((source) => (
                  <ExternalLink key={source.url} href={source.url} label={source.title}>{source.title}</ExternalLink>
                ))}
              </>
            ) : null}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginHorizontal: 20, marginBottom: 8 },
  card: { marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 16, paddingVertical: 16, gap: 8, borderRadius: 18 },
  more: { alignSelf: "flex-start", minHeight: 40, marginTop: 4, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
