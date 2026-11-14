import { useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, useLocalSearchParams } from "expo-router";
import { credits, sessionById } from "@/content";
import { useContent } from "@/content/provider";
import { displayCopy } from "@/content/display";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { Icon } from "@/components/Icon";
import { resolveUri } from "@/components/TappablePhoto";
import { useImageViewer } from "@/components/ImageViewer";
import { routeMaps } from "@/images";
import { sessionWhen } from "@/components/SessionRow";
import {
  ISLAND_ON_MAP,
  MAP_CROP,
  modeLabel,
  routeStops,
  routeSummary,
  type RouteStop,
} from "@/logic/transportPlan";
import { colors } from "@/theme";
import { nightGlass } from "@/components/nightGlass";
import { CustomRoute } from "@/components/CustomRoute";
import { dockClearance } from "@/components/Dock";

const SAMPLE_TILE = "/venues/ritz-carlton-st-thomas/img_1377-640.webp";
const BUILD_TILE = "/venues/hideout-white-bay/img_2673-640.webp";
const MAP_FALLBACK = "/venues/hideout-white-bay/img_2673-640.webp";
/** Short enough that the first stop starts above the dock on a 390-wide phone. */
const MAP_FRAME = 200;

const MAP_HEIGHT: Record<string, number> = {
  "ferry-2027-01-26.png": 1662,
  "ferry-2027-01-27.png": 1636,
  "ferry-2027-01-28.png": 1894,
  "ferry-2027-01-29.png": 1688,
  "powerboat-2027-01-26.png": 1842,
  "powerboat-2027-01-27.png": 1816,
  "powerboat-2027-01-28.png": 1842,
  "powerboat-2027-01-29.png": 1816,
  "yacht-2027-01-26.png": 1636,
  "yacht-2027-01-27.png": 1636,
  "yacht-2027-01-28.png": 1636,
  "yacht-2027-01-29.png": 1610,
};

export default function TransportScreen() {
  const { program } = useContent();
  const { forum, transport } = program;
  const viewer = useImageViewer();
  const insets = useSafeAreaInsets();
  const [modeId, setModeId] = useState(transport.modes[0].id);
  const [date, setDate] = useState(transport.modes[0].days[0].date);
  const [selected, setSelected] = useState<string | null>(null);
  const [about, setAbout] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const params = useLocalSearchParams<{ build?: string }>();
  const [view, setView] = useState<"sample" | "mine">(params.build === "1" ? "mine" : "sample");
  const mode = transport.modes.find((item) => item.id === modeId) ?? transport.modes[0];
  const day = mode.days.find((item) => item.date === date) ?? mode.days[0];
  const dayMeta = forum.days.find((item) => item.id === day.date);
  const dayIndex = Math.max(1, forum.days.findIndex((item) => item.id === day.date) + 1);
  const stops = routeStops(day, sessionById, (session) => sessionWhen(session, forum.timezone));
  const active = stops.find((stop) => stop.key === selected) ?? stops[0];
  const summary = routeSummary(dayIndex, day.items, stops.map((stop) => stop.island ?? ""));
  const mapHeight = MAP_HEIGHT[day.map] ?? 1800;

  function chooseMode(id: string) {
    const next = transport.modes.find((item) => item.id === id) ?? transport.modes[0];
    setModeId(next.id);
    if (!next.days.some((item) => item.date === date)) setDate(next.days[0].date);
    setSelected(null);
  }

  function openMap() {
    const source = routeMaps[day.map];
    const uri = resolveUri(source);
    if (!uri) return;
    viewer.open([{ uri, alt: day.mapDescription }]);
  }

  return (
    <Screen edge="none" scroll={false}>
      <View style={styles.column}>
        <StackHeader title="Transport" />
        <View style={styles.choices}>
          <ChoiceTile label="Sample routes" image={SAMPLE_TILE} fallback={BUILD_TILE} selected={view === "sample"} onPress={() => setView("sample")} />
          <ChoiceTile label="Build my route" image={BUILD_TILE} fallback={SAMPLE_TILE} selected={view === "mine"} onPress={() => setView("mine")} />
        </View>
        {view === "mine" ? (
          <CustomRoute sessions={program.sessions} days={forum.days} modes={transport.modes} pillars={forum.pillars} timeZone={forum.timezone} />
        ) : (
        <View style={styles.sample}>
        <View style={styles.sticky}>
          <View style={styles.segment}>
            {transport.modes.map((item) => {
              const on = item.id === mode.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={item.name}
                  onPress={() => chooseMode(item.id)}
                  style={[styles.segmentItem, on && styles.segmentOn]}
                >
                  <T variant="meta" color={on ? colors.ink : colors.foam} numberOfLines={2} style={styles.segmentLabel}>
                    {modeLabel(item)}
                  </T>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.segment}>
            {mode.days.map((item) => {
              const meta = forum.days.find((dayItem) => dayItem.id === item.date);
              const on = item.date === day.date;
              const label = meta?.phase?.trim() && meta.label ? meta.label : meta ? `${meta.shortWeekday} ${meta.dayNumber}` : item.date;
              return (
                <Pressable
                  key={item.date}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={meta?.label ?? item.date}
                  onPress={() => {
                    setDate(item.date);
                    setSelected(null);
                  }}
                  style={[styles.segmentItem, on && styles.segmentOn]}
                >
                  <T variant="meta" color={on ? colors.ink : colors.foam} style={styles.segmentLabel}>
                    {label}
                  </T>
                </Pressable>
              );
            })}
          </View>
          <T variant="small" color={colors.foam}>{summary}</T>
          {dayMeta ? <T variant="meta" color={colors.gold}>{dayMeta.phase}</T> : null}
        </View>
        <ScrollView style={styles.fill} contentContainerStyle={[styles.scroll, { paddingBottom: dockClearance(insets.bottom) }]} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${day.mapDescription}`}
            testID="transport-map"
            onPress={openMap}
            style={styles.mapFrame}
          >
            <RouteMap source={routeMaps[day.map]} height={mapHeight} />
            {active?.island && ISLAND_ON_MAP[active.island] ? (
              <View
                pointerEvents="none"
                style={[
                  styles.ring,
                  {
                    left: `${ISLAND_ON_MAP[active.island].x * 100}%`,
                    top: `${ISLAND_ON_MAP[active.island].y * 100}%`,
                  },
                ]}
              />
            ) : null}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Map credits" onPress={() => setCreditsOpen(true)} style={styles.creditsLink}>
            <T variant="meta" color={colors.gold}>Map credits</T>
          </Pressable>
          {stops.map((stop) => (
            <StopCard
              key={stop.key}
              stop={stop}
              selected={stop.key === active?.key}
              start={stop.number === 1 ? day.start : null}
              onSelect={() => setSelected(stop.key)}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: about }}
            accessibilityLabel="About these routes"
            onPress={() => setAbout((open) => !open)}
            style={styles.about}
          >
            <T variant="rowTitle">About these routes</T>
            <T variant="meta" color={colors.gold}>{about ? "Hide" : "Show"}</T>
          </Pressable>
          {about ? (
            <View style={styles.aboutBody}>
              <T variant="small">{transport.intro}</T>
              <T variant="meta">Checked {transport.checked}.</T>
              <T variant="small">{mode.description}</T>
              <T variant="small">{mode.warning}</T>
              <T variant="meta">{transport.venueAssumptions}</T>
              <T variant="meta">{transport.borderNote}</T>
              <T variant="meta">{day.start}</T>
              <T variant="meta">Overnight: {day.overnight}</T>
              <T variant="eyebrow" color={colors.gold}>Schedules</T>
              {transport.sources.map((source) => (
                <Pressable key={source.url} accessibilityRole="link" accessibilityLabel={source.title} onPress={() => Linking.openURL(source.url).catch(() => undefined)} style={styles.schedule}>
                  <T variant="button" color={colors.ink} numberOfLines={2}>{source.title}</T>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
        </View>
        )}
        {creditsOpen ? (
          <View style={styles.sheetWrap}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close map credits" onPress={() => setCreditsOpen(false)} style={styles.sheetBackdrop} />
            <View style={styles.sheet}>
              <T variant="rowTitle">Map credits</T>
              <T variant="small">{credits.sentinelNote}</T>
              <T variant="meta">{credits.sentinel}</T>
              <T variant="meta">{credits.sentinelLicense}</T>
              <T variant="meta">{credits.sentinelDocumentation}</T>
              <T variant="meta">{credits.coastline}</T>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setCreditsOpen(false)} style={styles.sheetClose}>
                <T variant="button" color={colors.ink}>Close</T>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function ChoiceTile({ label, image, fallback, selected, onPress }: { label: string; image: string; fallback: string; selected: boolean; onPress: () => void }) {
  const [src, setSrc] = useState(image);
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress} style={[styles.choice, selected && styles.choiceOn]}>
      <Image
        source={{ uri: src }}
        style={styles.choicePhoto}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        onError={() => setSrc((current) => (current === fallback ? current : fallback))}
      />
      <View style={styles.choiceShade} />
      <T variant="small" color={colors.foam} style={styles.choiceLabel}>{label}</T>
    </Pressable>
  );
}

function RouteMap({ source, height }: { source: (typeof routeMaps)[string]; height: number }) {
  const [failed, setFailed] = useState(false);
  const posterHeight = `${(height / MAP_CROP) * 100}%`;
  return failed ? (
    <Image source={{ uri: MAP_FALLBACK }} style={styles.mapFill} resizeMode="cover" accessibilityIgnoresInvertColors />
  ) : (
    <Image
      source={source}
      resizeMode="stretch"
      accessibilityIgnoresInvertColors
      onError={() => setFailed(true)}
      style={[styles.mapImage, { height: posterHeight }]}
    />
  );
}

function StopCard({
  stop,
  selected,
  start,
  onSelect,
}: {
  stop: RouteStop;
  selected: boolean;
  start: string | null;
  onSelect: () => void;
}) {
  const badge = stop.status ?? "Unconfirmed";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={stop.title ?? stop.legs[0]?.time ?? "Transfer"}
      onPress={onSelect}
      style={[styles.stop, selected && styles.stopOn]}
    >
      <View style={styles.stopHead}>
        {stop.number ? (
          <View style={styles.num}>
            <T variant="meta" color={colors.ink}>{stop.number}</T>
          </View>
        ) : null}
        <View style={styles.stopHeadCopy}>
          {stop.when ? <T variant="meta" color={colors.gold}>{stop.when}</T> : null}
          {stop.island ? <T variant="small">{stop.island}</T> : <T variant="small">Crossing</T>}
        </View>
        <View style={styles.badge}>
          <T variant="meta" color={colors.ink}>{badge}</T>
        </View>
      </View>
      {stop.sessionId && stop.title ? (
        <Link href={{ pathname: "/session/[id]", params: { id: stop.sessionId } }} asChild>
          <Pressable accessibilityRole="link" accessibilityLabel={stop.title} style={styles.sessionLink}>
            <T variant="rowTitle" numberOfLines={3} style={styles.sessionTitle}>{displayCopy(stop.title)}</T>
            <Icon name="chevron" size={18} color={colors.gold} />
          </Pressable>
        </Link>
      ) : null}
      {start ? <T variant="meta">{start}</T> : null}
      {stop.legs.map((leg) => (
        <View key={`${leg.time}-${leg.from}`} style={styles.leg}>
          <Icon name="seat" size={16} color={colors.gold} />
          <View style={styles.legCopy}>
            <T variant="meta" color={colors.foam}>{leg.time}{leg.caution ? " · tight" : ""}</T>
            <T variant="meta">From {leg.from}{leg.to ? ` to ${leg.to}` : ""}</T>
          </View>
        </View>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1 },
  sample: { flex: 1 },
  choices: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  choice: { flex: 1, height: 108, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", borderWidth: 2, borderColor: "transparent", backgroundColor: "#071421" },
  choiceOn: { borderColor: colors.gold },
  choicePhoto: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  choiceShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    ...({ backgroundImage: "linear-gradient(to top, rgba(6,14,24,0.92), rgba(6,14,24,0))" } as ViewStyle),
  },
  choiceLabel: { paddingHorizontal: 10, paddingBottom: 10 },
  fill: { flex: 1 },
  sticky: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  segment: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 16, ...nightGlass },
  segmentItem: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, paddingVertical: 6, borderRadius: 12 },
  segmentOn: { backgroundColor: colors.gold },
  segmentLabel: { textAlign: "center" },
  scroll: { paddingHorizontal: 12, gap: 8 },
  mapFrame: {
    width: "100%",
    height: MAP_FRAME,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#071421",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,224,138,0.48)",
  },
  mapImage: { position: "absolute", top: 0, left: 0, width: "100%" },
  mapFill: { width: "100%", height: "100%" },
  ring: {
    position: "absolute",
    width: 36,
    height: 36,
    marginLeft: -18,
    marginTop: -18,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.gold,
    backgroundColor: "rgba(255,224,138,0.18)",
  },
  creditsLink: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  stop: { padding: 12, gap: 8, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,138,0.28)", ...nightGlass },
  stopOn: { borderColor: colors.gold, borderWidth: 1 },
  stopHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  stopHeadCopy: { flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 2 },
  num: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.gold },
  sessionLink: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  sessionTitle: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
  leg: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  legCopy: { flex: 1, gap: 2 },
  about: { minHeight: 52, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", ...nightGlass },
  aboutBody: { padding: 16, gap: 8, borderRadius: 16, ...nightGlass },
  schedule: { alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 16, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  sheetWrap: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, justifyContent: "flex-end" },
  sheetBackdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(6,14,24,0.55)" },
  sheet: { margin: 12, padding: 16, gap: 8, borderRadius: 18, ...nightGlass },
  sheetClose: { minHeight: 48, marginTop: 4, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
});
