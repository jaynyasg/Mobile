import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { forum, notifications, sessions, sponsors } from "@/content";
import { Screen } from "@/components/Screen";
import { SessionRow } from "@/components/SessionRow";
import { Icon, IconName } from "@/components/Icon";
import { T } from "@/components/Text";
import { SectionLabel } from "@/components/ui";
import { upcomingSessions } from "@/logic/agenda";
import { forumPhase, phaseLabel } from "@/logic/phase";
import { useApp } from "@/store";
import { colors, pad } from "@/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const phase = forumPhase(new Date());
  const next = upcomingSessions(sessions, new Date(), 3);
  const host = sponsors.find((sponsor) => sponsor.tier === "host");
  const latest = [...notifications].sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
  const unread = notifications.filter((note) => !state.readNotificationIds.includes(note.id)).length;

  return (
    <Screen edge="none" statusBar="light">
      <View style={[styles.hero, { paddingTop: insets.top + 22 }]}>
        <T variant="eyebrow" color={colors.brassSoft}>
          Portico
        </T>
        <T variant="display" color={colors.ivory}>
          Assembly
        </T>
        <T variant="body" color={colors.ivory} style={styles.tagline}>
          {forum.tagline}
        </T>
        <View style={styles.rule} />
        <T variant="small" color={colors.ivory}>
          {forum.dateLabel}
        </T>
        <T variant="small" color={colors.brassSoft}>
          {forum.venue.name} · Seattle
        </T>
        <T variant="headline" color={colors.ivory} style={styles.phase}>
          {phaseLabel(phase)}
        </T>
      </View>

      <View style={styles.actions}>
        <Action href="/ticket" icon="ticket" label="Badge" />
        <Action href="/schedule" icon="calendar" label="Schedule" />
        <Action href="/venue" icon="pin" label="Hall" />
        <Action href="/notifications" icon="bell" label="Notes" badge={unread} />
      </View>

      <SectionLabel>Next on the program</SectionLabel>
      {next.map((session) => (
        <SessionRow key={session.id} session={session} />
      ))}

      <SectionLabel>Side gatherings</SectionLabel>
      <Gathering href="/studio-walk" when="Wednesday · 5:30 PM" title="Studio Walk" detail="Eight tables in the Arcade" />
      <Gathering href="/talent-market" when="Thursday · 1:00 PM" title="Talent Market" detail="Hiring tables in the Cloister" />

      {host ? (
        <>
          <SectionLabel>Host</SectionLabel>
          <Link href={{ pathname: "/sponsor/[id]", params: { id: host.id } }} asChild>
            <Pressable style={styles.host}>
              <T variant="rowTitle">{host.name}</T>
              <T variant="meta">{host.summary}</T>
            </Pressable>
          </Link>
        </>
      ) : null}

      {latest ? (
        <>
          <SectionLabel>From the desk</SectionLabel>
          <Link href="/notifications" asChild>
            <Pressable style={styles.host}>
              <T variant="rowTitle">{latest.title}</T>
              <T variant="meta">{latest.body}</T>
            </Pressable>
          </Link>
        </>
      ) : null}
    </Screen>
  );
}

function Action({
  href,
  icon,
  label,
  badge,
}: {
  href: "/ticket" | "/schedule" | "/venue" | "/notifications";
  icon: IconName;
  label: string;
  badge?: number;
}) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button" style={styles.action}>
        <Icon name={icon} color={colors.pine} />
        <T variant="meta" color={colors.ink}>
          {label}
        </T>
        {badge ? <View style={styles.badge} /> : null}
      </Pressable>
    </Link>
  );
}

function Gathering({ href, when, title, detail }: { href: "/studio-walk" | "/talent-market"; when: string; title: string; detail: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.gather}>
        <View style={styles.gatherRule} />
        <View style={styles.gatherCopy}>
          <T variant="eyebrow">{when}</T>
          <T variant="headline" style={styles.gatherTitle}>
            {title}
          </T>
          <T variant="meta">{detail}</T>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.pine, paddingHorizontal: pad, paddingBottom: 28, gap: 4 },
  tagline: { marginTop: 10, maxWidth: 320, color: colors.ivory },
  rule: { height: 1, width: 48, backgroundColor: colors.brassSoft, marginVertical: 14 },
  phase: { marginTop: 8, fontSize: 22, lineHeight: 26 },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  action: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 14 },
  badge: {
    position: "absolute",
    top: 10,
    right: 22,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.clay,
  },
  gather: { flexDirection: "row", gap: 14, paddingHorizontal: pad, paddingVertical: 12 },
  gatherRule: { width: 2, backgroundColor: colors.brass },
  gatherCopy: { flex: 1, gap: 3 },
  gatherTitle: { fontSize: 22, lineHeight: 26 },
  host: {
    marginHorizontal: pad,
    padding: 16,
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 6,
  },
});
