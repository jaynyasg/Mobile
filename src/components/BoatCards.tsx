import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BOAT_ACCESS, BOATS_ONLY, boatOptions, mapsDirections, mapsSearch, stayHops, type BoatOption } from "@/logic/boatOptions";
import { WhereToBoard } from "./WhereToBoard";
import { colors } from "@/theme";
import { nightGlass } from "./nightGlass";
import { ExternalLink, ExternalText } from "./ExternalLink";
import { T } from "./Text";

export function BoatCallout() {
  const router = useRouter();
  return (
    <View style={styles.callout}>
      <T variant="eyebrow" color={colors.ink}>Between islands</T>
      <T variant="title" color={colors.ink}>Boats only</T>
      <T variant="small" color={colors.ink}>{BOATS_ONLY}</T>
      <T variant="rowTitle" color={colors.ink}>How you get on one</T>
      {BOAT_ACCESS.map((item) => (
        <View key={item.id} style={styles.access}>
          <T variant="meta" color={colors.gold}>{item.title}</T>
          <T variant="small" color={colors.foam}>{item.pass}</T>
          <T variant="small" color={colors.foam}>{item.reserve}</T>
          <T variant="small" color={colors.foam}>{item.board}</T>
          <T variant="small" color={colors.foam}>{item.without}</T>
        </View>
      ))}
      <Pressable accessibilityRole="button" accessibilityLabel="Upgrade your pass in Tickets" onPress={() => router.push("/tickets")} style={styles.upgrade}>
        <T variant="button" color={colors.foam}>Upgrade in Tickets</T>
      </Pressable>
    </View>
  );
}

export function BoatCards() {
  return (
    <View style={styles.wrap}>
      <T variant="eyebrow" color={colors.gold}>Which boat</T>
      <T variant="small" color={colors.foam}>Three passes, three boats. Be on the Beach is the public ferry. Be on the Boat is a private charter for the day. Be on Board is the VIP charter you stay on for all 5 days. A taxi never leaves its island.</T>
      {boatOptions.map((boat) => (
        <BoatCard key={boat.id} boat={boat} />
      ))}
      <T variant="eyebrow" color={colors.gold}>Taxi, on one island</T>
      <T variant="small" color={colors.foam}>A taxi does not go to another island. It takes you on land, from the place you sleep to the dock where the boat leaves. The exact session room is still to be confirmed.</T>
      {stayHops.map((hop) => (
        <View key={hop.island} style={styles.card}>
          <T variant="rowTitle" color={colors.foam}>{hop.island}</T>
          <T variant="meta" color={colors.gold}>{hop.from} → {hop.to}</T>
          <T variant="small" color={colors.foam}>{hop.how}</T>
          <ExternalLink href={mapsDirections(hop.origin, hop.destination)} label={`Map from ${hop.from} to ${hop.to}`}>
            Map this taxi
          </ExternalLink>
        </View>
      ))}
    </View>
  );
}

function BoatCard({ boat }: { boat: BoatOption }) {
  const rows = [
    ["What it is", boat.what],
    ["Shared or private", boat.shared],
    ["Speed", boat.speed],
    ["Comfort", boat.comfort],
    ["Your pass", boat.pass],
    ["How you get it", boat.how],
    ["Where you board", boat.board],
    ["Check-in", boat.checkIn],
    ["Bring", boat.bring],
  ];
  return (
    <View style={styles.card}>
      <T variant="eyebrow" color={colors.gold}>{boat.kicker}</T>
      <T variant="title" color={colors.foam}>{boat.title}</T>
      {rows.map(([label, body]) => (
        <View key={label} style={styles.row}>
          <T variant="meta" color={colors.gold}>{label}</T>
          <T variant="small" color={colors.foam}>{body}</T>
        </View>
      ))}
      {boat.id === "ferry" ? <WhereToBoard /> : (
        <>
          <T variant="meta" color={colors.gold}>Docks</T>
          {boat.docks.map((dock) => (
            <ExternalLink key={dock.name} href={dock.url ?? mapsSearch(dock.query)} label={dock.name}>
              {dock.name}
            </ExternalLink>
          ))}
        </>
      )}
      <T variant="meta" color={colors.gold}>Sources</T>
      {boat.sources.map((source) => (
        <ExternalText key={source.url} href={source.url} label={source.title} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginBottom: 8 },
  callout: { marginHorizontal: 12, marginBottom: 8, padding: 16, gap: 8, borderRadius: 22, backgroundColor: colors.gold },
  access: { gap: 4, padding: 12, borderRadius: 16, backgroundColor: "#10283A" },
  upgrade: { minHeight: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#10283A" },
  card: { padding: 14, gap: 8, borderRadius: 18, ...nightGlass },
  row: { gap: 2 },
});
