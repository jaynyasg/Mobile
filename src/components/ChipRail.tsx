import { useEffect, useRef, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";

/** A horizontal chip row that starts at the left padding and fades the cut edge. */
export function ChipRail({ children, pad = 16 }: { children: ReactNode; pad?: number }) {
  const scroller = useRef<{ scrollTo: (options: { x?: number; animated?: boolean }) => void } | null>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ x: 0, animated: false });
  }, []);
  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scroller as never}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[styles.row, { paddingLeft: pad, paddingRight: pad + 56 }]}
      >
        {children}
      </ScrollView>
      <View pointerEvents="none" style={styles.fade} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", width: "100%", overflow: "hidden" },
  scroll: { width: "100%" },
  row: {
    flexDirection: "row",
    flexGrow: 0,
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  fade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 48,
    zIndex: 2,
    ...({ backgroundImage: "linear-gradient(to right, rgba(7,20,33,0) 0%, rgba(7,20,33,0.35) 42%, rgba(6,14,24,0.96) 100%)" } as ViewStyle),
  },
});
