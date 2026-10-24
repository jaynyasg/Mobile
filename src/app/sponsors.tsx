import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { sponsors, tierLabel } from "@/content";
import type { SponsorTier } from "@/content/types";
import { Monogram } from "@/components/Monogram";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { SectionLabel } from "@/components/ui";
import { colors, pad } from "@/theme";

const order: SponsorTier[] = ["host", "patron", "partner"];
const headings: Record<SponsorTier, string> = { host: "Host", patron: "Patrons", partner: "Partners" };

export default function SponsorsScreen() {
  return (
    <Screen edge="none">
      <StackHeader title="Sponsors" />
      <T variant="meta" style={styles.intro}>
        Sponsors are part of the program, with the offer written down. Leaving a card stores your name on this phone only.
      </T>
      {order.map((tier) => {
        const group = sponsors.filter((sponsor) => sponsor.tier === tier);
        if (group.length === 0) return null;
        return (
          <View key={tier}>
            <SectionLabel>{headings[tier]}</SectionLabel>
            {group.map((sponsor) => (
              <Link key={sponsor.id} href={{ pathname: "/sponsor/[id]", params: { id: sponsor.id } }} asChild>
                <Pressable style={styles.row}>
                  <Monogram name={sponsor.name} />
                  <View style={styles.copy}>
                    <T variant="eyebrow">{tierLabel[sponsor.tier]}</T>
                    <T variant="rowTitle">{sponsor.name}</T>
                    <T variant="meta" numberOfLines={2}>
                      {sponsor.deals[0]?.title ?? sponsor.summary}
                    </T>
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: pad, marginBottom: 8 },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: pad,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  copy: { flex: 1, gap: 2 },
});
