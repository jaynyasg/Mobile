import { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { nightGlass } from "./nightGlass";
import { colors, pad } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

export function StackHeader({ title, right }: { title?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.bar, Platform.OS === "web" ? webBlur : null, { paddingTop: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        style={styles.back}
      >
        <Icon name="back" color={colors.gold} />
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

const webBlur = { backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" } as ViewStyle;

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: pad,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...nightGlass,
    backgroundColor: "rgba(7,27,42,0.88)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,224,138,0.45)",
  },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { flex: 1 },
});
