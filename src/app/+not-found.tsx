import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { T } from "@/components/Text";
import { colors, pad } from "@/theme";

export default function NotFoundScreen() {
  return (
    <View style={styles.page}>
      <T variant="eyebrow">Portico</T>
      <T variant="title">That page is not on the program.</T>
      <Link href="/">
        <T variant="button" color={colors.brass}>
          Back to Assembly
        </T>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper, padding: pad, justifyContent: "center", gap: 12 },
});
