import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { essentials } from "@/guide/essentials";
import { colors } from "@/theme";
import { ExternalLink } from "@/components/ExternalLink";
import { BVI_ENTRY, OFFICIAL_BVI_FERRY_URL, OFFICIAL_USVI_FERRY_URL, SCRUB_FERRY_GUEST, SCRUB_FERRY_LABEL, SCRUB_FERRY_PHONE, SCRUB_FERRY_URL } from "@/logic/ferrySchedule";
import { WhereToBoard } from "@/components/WhereToBoard";
import { StepBridge } from "@/components/StepBridge";
import { nightGlass } from "@/components/nightGlass";

export default function KnowScreen() {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <Screen edge="none">
      <StackHeader title="Preparation guide" />
      <StepBridge id="know" />
      <View style={styles.lead}>
        <T variant="small">What to have ready before you travel: documents, money, driving, and the border. You change islands only by boat. Be on the Beach is the public ferry, on a fixed schedule, and a taxi on land. Be on the Boat is a private charter for the day, leaving at set group times. Be on Board is the VIP charter you stay on for all 5 days, on your group's own schedule. St. Thomas to St. John times are on the official USVI ferry schedule. They can change. Check it before you travel.</T>
      </View>
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
        <T variant="rowTitle" color={colors.foam}>Scrub Island ferry</T>
        <T variant="small" color={colors.foam}>{SCRUB_FERRY_LABEL}</T>
        <T variant="small" color={colors.foam}>{SCRUB_FERRY_GUEST}</T>
        <T variant="small" color={colors.foam}>From Trellis Bay: 5:45, 6:45, 7:45, 8:45, 9:45, and 11:45am, then 1:45, 2:45, 3:45, 4:45, 5:45, 7:45, 9:45, and 10:45pm. From Scrub Island: 6:30, 7:30, 8:30, 9:30, and 11:30am, then 1:30, 2:30, 3:30, 4:30, 5:30, 7:30, 9:30, and 10:30pm.</T>
        <ExternalLink href={SCRUB_FERRY_PHONE} label="Resort Hosts +1 284-394-3440">Resort Hosts +1 284-394-3440</ExternalLink>
        <ExternalLink href="https://maps.app.goo.gl/EQJk9J5TPCWS2RxG7" label="Trellis Bay, Beef Island, Tortola">Trellis Bay, Beef Island, Tortola</ExternalLink>
        <ExternalLink href={SCRUB_FERRY_URL} label="Scrub Island">Scrub Island</ExternalLink>
      </View>
      <View style={[styles.card, nightGlass]}>
        <WhereToBoard />
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
  lead: { marginHorizontal: 16, marginBottom: 10, padding: 14, gap: 8, borderRadius: 18, ...nightGlass },
  card: { marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 16, paddingVertical: 16, gap: 8, borderRadius: 18 },
  more: { alignSelf: "flex-start", minHeight: 40, marginTop: 4, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
