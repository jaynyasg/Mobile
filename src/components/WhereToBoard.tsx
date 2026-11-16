import { StyleSheet, View } from "react-native";
import { DOCK_GROUPS, LOVANGO_FERRY_BOOK_URL } from "@/logic/ferryDocks";
import { colors } from "@/theme";
import { ExternalLink } from "./ExternalLink";
import { T } from "./Text";

/** Owner pins, grouped by island. Schedule cards link a pin only when that end of the trip is named. */
export function WhereToBoard() {
  return (
    <View style={styles.wrap}>
      <T variant="rowTitle" color={colors.foam}>Where to board</T>
      <T variant="small" color={colors.foam}>Docks with a pin, by island. A route card links a pin only when the official schedule names that end of the trip. Spanish Town, Scrub Island, and Lovango’s own Red Hook pier are not pinned.</T>
      {DOCK_GROUPS.map((group) => (
        <View key={group.id} style={styles.group}>
          <T variant="meta" color={colors.gold}>{group.island}</T>
          {group.docks.map((dock) => (
            <ExternalLink key={dock.id} href={dock.url} label={dock.name}>{dock.name}</ExternalLink>
          ))}
        </View>
      ))}
      <ExternalLink href={LOVANGO_FERRY_BOOK_URL} label="Book the Lovango ferry">Book the Lovango ferry</ExternalLink>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  group: { gap: 6 },
});
