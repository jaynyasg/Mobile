import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { sponsorById, tierLabel } from "@/content";
import { Monogram } from "@/components/Monogram";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { EmptyState, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useApp } from "@/store";
import { colors, fonts, pad } from "@/theme";

export default function SponsorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sponsor = sponsorById(String(id));
  const { state, dispatch } = useApp();
  const [notice, setNotice] = useState("");
  if (!sponsor) {
    return (
      <Screen edge="none" scroll={false}>
        <StackHeader title="Sponsor" />
        <EmptyState title="Not on the list" body="This sponsor is not part of Assembly." />
      </Screen>
    );
  }
  const left = state.sharedCardSponsorIds.includes(sponsor.id);
  return (
    <Screen edge="none">
      <StackHeader title={tierLabel[sponsor.tier]} />
      <View style={styles.body}>
        <Monogram name={sponsor.name} size={72} />
        <T variant="title">{sponsor.name}</T>
        <T variant="body">{sponsor.summary}</T>
        {sponsor.deals.map((deal) => (
          <View key={deal.id} style={styles.deal}>
            <T variant="eyebrow">Deal</T>
            <T variant="headline" style={styles.dealTitle}>
              {deal.title}
            </T>
            <T variant="small">{deal.detail}</T>
            {deal.code ? <T variant="small" style={styles.code}>{deal.code}</T> : null}
          </View>
        ))}
        {left ? (
          <SecondaryButton
            label="Remove my card"
            onPress={() => {
              dispatch({ type: "leaveCard", sponsorId: sponsor.id });
              setNotice("Card removed from this device.");
            }}
          />
        ) : (
          <PrimaryButton
            label="Leave my card"
            onPress={() => {
              if (!state.profile.name.trim()) {
                setNotice("Add your name in Settings before you leave a card.");
                return;
              }
              dispatch({ type: "leaveCard", sponsorId: sponsor.id });
              setNotice(`Saved for ${sponsor.name} on this device. Nothing was sent.`);
            }}
          />
        )}
        <T variant="meta">
          {left
            ? `${state.profile.name || "Your name"}, ${state.profile.title}${state.profile.company ? `, ${state.profile.company}` : ""}. Stored only on this phone.`
            : "Leaving a card keeps your name and title on this phone. Delete my data removes it."}
        </T>
        {notice ? <T variant="small">{notice}</T> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: pad, gap: 12 },
  deal: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    padding: 16,
    gap: 6,
  },
  dealTitle: { fontSize: 22, lineHeight: 26 },
  code: { fontFamily: fonts.semibold, letterSpacing: 1.2, marginTop: 4 },
});
