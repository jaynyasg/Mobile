import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, View, ViewStyle, useWindowDimensions, type ScrollViewInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContent } from "@/content/provider";
import { beaconPoster, scenes } from "@/images";
import { colors } from "@/theme";
import { welcomePages } from "@/welcome";
import {
  clearInstallPrompt,
  getInstallPrompt,
  installChoice,
  type InstallChoice,
} from "./installPrompt";
import { nightGlass } from "./nightGlass";
import { T } from "./Text";

const photos: Record<string, { source: ImageSourcePropType; alt: string }> = {
  what: { source: beaconPoster, alt: "Coast and a yacht" },
  islands: { source: scenes["scene-05.jpg"], alt: "Jost Van Dyke" },
  sessions: { source: scenes["scene-07.jpg"], alt: "Scrub Island Resort" },
  around: { source: scenes["scene-02.jpg"], alt: "Red Hook marina" },
  together: { source: scenes["scene-03.jpg"], alt: "Lovango Cay" },
};

function installContext(hasPrompt: boolean) {
  const standalone = typeof window !== "undefined" && Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches);
  const navigatorStandalone = typeof navigator !== "undefined" && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return {
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    displayModeStandalone: standalone,
    navigatorStandalone,
    maxTouchPoints: typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints,
    hasPrompt,
  };
}

function installLine(choice: InstallChoice): string {
  if (choice === "ios-safari") return "Tap Share, then Add to Home Screen.";
  if (choice === "ios-browser") return "Open Safari, or tap Share in the address bar, then Add to Home Screen.";
  return "Open the browser menu, then Install app or Add to Home screen.";
}

export function Welcome({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { program } = useContent();
  const { forum, stays, passes } = program;
  const pages = welcomePages({
    name: forum.name,
    edition: forum.edition,
    kicker: forum.kicker,
    dateLabel: forum.dateLabel,
    placeLabel: forum.placeLabel,
    pillars: forum.pillars,
    days: forum.days,
    staysIntro: stays.intro,
    passNote: "The pass is a design preview. No payment is collected.",
  });
  const [step, setStep] = useState(0);
  const [installed, setInstalled] = useState(() => installChoice(installContext(false)) === "hide");
  const [hint, setHint] = useState("");
  const scroller = useRef<ScrollViewInstance>(null);
  const page = pages[Math.min(step, pages.length - 1)];
  const last = step >= pages.length - 1;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function go(next: number) {
    const index = Math.max(0, Math.min(pages.length - 1, next));
    setStep(index);
    scroller.current?.scrollTo({ x: width * index, animated: true });
  }

  async function addToHome() {
    const event = getInstallPrompt();
    const choice = installChoice(installContext(Boolean(event)));
    if (choice === "prompt" && event) {
      try {
        await event.prompt();
        const result = await event.userChoice;
        clearInstallPrompt();
        if (result?.outcome === "accepted") setInstalled(true);
      } catch {
        clearInstallPrompt();
        setHint(installLine("menu"));
      }
      return;
    }
    setHint(installLine(choice === "hide" || choice === "prompt" ? "menu" : choice));
  }

  const sheet = (
    <View style={styles.overlay} accessibilityViewIsModal accessibilityLabel="How TATEL works">
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
          setStep(Math.max(0, Math.min(pages.length - 1, index)));
        }}
        style={styles.pager}
      >
        {pages.map((item) => {
          const photo = photos[item.id] ?? photos.what;
          return (
            <View key={item.id} style={[styles.page, { width }]}>
              <Image source={photo.source} style={styles.photo} resizeMode="cover" accessibilityLabel={photo.alt} />
              <View style={styles.shade} />
              <View style={[styles.copy, nightGlass, { marginBottom: 148 + insets.bottom }]}>
                {item.kicker ? <T variant="eyebrow" color={colors.gold}>{item.kicker}</T> : null}
                <T variant="title" color={colors.foam}>{item.title}</T>
                <T variant="body" color={colors.foam}>{item.body}</T>
                {item.install && !installed ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Add to Home Screen" onPress={() => addToHome().catch(() => setHint(installLine("menu")))} style={styles.install}>
                    <T variant="button" color={colors.foam}>Add to Home Screen</T>
                  </Pressable>
                ) : null}
                {item.install && hint ? <T variant="meta" color={colors.gold}>{hint}</T> : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={[styles.controls, { bottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.dots}>
          {pages.map((item, index) => (
            <View key={item.id} style={[styles.dot, index === step && styles.dotOn]} />
          ))}
        </View>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={onClose} style={styles.skip}>
            <T variant="button" color={colors.foam}>Skip</T>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={last ? "Get started" : "Next"}
            onPress={() => (last ? onClose() : go(step + 1))}
            style={styles.next}
          >
            <T variant="button" color={colors.ink}>{last ? "Get started" : "Next"}</T>
          </Pressable>
        </View>
      </View>
    </View>
  );
  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

const fixed = { position: "fixed" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  overlay: { ...fixed, top: 0, right: 0, bottom: 0, left: 0, zIndex: 90, backgroundColor: "#071421" },
  pager: { flex: 1 },
  page: { flex: 1, justifyContent: "flex-end" },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  shade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...({ backgroundImage: "linear-gradient(to bottom, rgba(6,14,24,0.15) 20%, rgba(6,14,24,0.72) 78%)" } as ViewStyle),
  },
  copy: { marginHorizontal: 16, marginBottom: 108, gap: 10, borderRadius: 22, padding: 18 },
  install: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,224,138,0.7)" },
  controls: { position: "absolute", left: 16, right: 16, gap: 12 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(245,241,232,0.4)" },
  dotOn: { backgroundColor: colors.gold, width: 18 },
  row: { flexDirection: "row", gap: 10 },
  skip: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,224,138,0.48)", backgroundColor: "rgba(7,27,42,0.58)" },
  next: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.gold },
});
