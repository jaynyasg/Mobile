import { StyleSheet, View } from "react-native";
import type { Exhibitor, SubEvent } from "@/content/types";
import { colors, fonts, pad } from "@/theme";
import { T } from "./Text";

export function ExhibitorList({
  subEvent,
  exhibitors,
  showRoles = false,
}: {
  subEvent: SubEvent;
  exhibitors: Exhibitor[];
  showRoles?: boolean;
}) {
  return (
    <View>
      <View style={styles.intro}>
        <T variant="eyebrow">{subEvent.whenLabel}</T>
        <T variant="title">{subEvent.name}</T>
        <T variant="meta">
          {subEvent.where}
        </T>
        <T variant="body" style={styles.summary}>
          {subEvent.summary}
        </T>
      </View>
      {exhibitors.map((exhibitor) => (
        <View key={exhibitor.id} style={styles.row}>
          <View style={styles.table}>
            <T variant="button" color={colors.ivory} style={styles.tableText}>
              {exhibitor.table}
            </T>
          </View>
          <View style={styles.copy}>
            <T variant="eyebrow">{exhibitor.category}</T>
            <T variant="rowTitle">{exhibitor.name}</T>
            <T variant="meta">{exhibitor.summary}</T>
            {showRoles && exhibitor.roles?.length ? (
              <T variant="small" style={styles.roles}>
                {exhibitor.roles.join(" · ")}
              </T>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: pad, gap: 6, paddingBottom: 12 },
  summary: { marginTop: 6 },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: pad,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  table: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: colors.pine,
    alignItems: "center",
    justifyContent: "center",
  },
  tableText: { fontFamily: fonts.semibold },
  copy: { flex: 1, gap: 3 },
  roles: { marginTop: 4 },
});
