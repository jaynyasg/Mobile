import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, pad } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

export function StackHeader({ title, right }: { title?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        style={styles.back}
      >
        <Icon name="back" />
      </Pressable>
      <View style={styles.title}>
        {title ? (
          <T variant="small" numberOfLines={1}>
            {title}
          </T>
        ) : null}
      </View>
      {right ?? <View style={styles.back} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: pad,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.paper,
  },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { flex: 1 },
});
