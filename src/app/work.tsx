import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { nightGlass } from "@/components/nightGlass";
import { SessionRow } from "@/components/SessionRow";
import { connectedSessions } from "@/logic/sessionJourney";
import { readWorkNote, saveWorkNote, WORK_FIELDS, workNoteText } from "@/logic/workNotes";
import { webStorage } from "@/welcome";
import { useApp } from "@/store";
import { colors } from "@/theme";

export default function WorkScreen() {
  const { session: id } = useLocalSearchParams<{ session?: string }>();
  const { program } = useContent();
  const { state } = useApp();
  const [all, setAll] = useState(false);
  const session = program.sessions.find(item => item.id === id);
  const pool = all ? program.sessions : program.sessions.filter(item => state.favoriteIds.includes(item.id));
  const series = [...new Map(pool.map(item => [item.workstream || item.id, connectedSessions(program.sessions, item)[0]])).values()];
  return <Screen edge="none"><StackHeader title="My work notebook" />
    <View style={styles.card}><T variant="title">Build something that lasts.</T><T variant="small">Follow a challenge from its first question to its next pilot. Keep your use case, test results, and next steps together for this summit and the annual review.</T><T variant="meta">Notes stay on this device. Save and export them to keep a copy or share with collaborators.</T></View>
    {session ? <Notebook key={session.workstream || session.id} id={session.workstream || session.id} title={connectedSessions(program.sessions, session)[0].title} /> : <View style={styles.card}>
      <T variant="rowTitle">{all ? "Explore the working series" : "From your saved sessions"}</T>
      {!series.length ? <T variant="small">Save a session to start following its connected work, or explore all the series.</T> : null}
      {series.map(item => <Link key={item.id} href={{ pathname: "/work", params: { session: item.id } }} asChild><Pressable accessibilityRole="button" style={styles.link}><T variant="rowTitle" color={colors.gold}>{item.title}</T><T variant="meta">{item.island} · Open notebook</T></Pressable></Link>)}
      <Pressable accessibilityRole="button" style={styles.link} onPress={() => setAll(!all)}><T variant="button" color={colors.gold}>{all ? "Show my saved series" : "Explore all working series"}</T></Pressable>
    </View>}
    {session ? <><View style={styles.card}><T variant="title">The connected sessions</T><T variant="small">Follow the linked work across its scheduled days. Each session contributes a different step.</T></View>{connectedSessions(program.sessions, session).map(item => <SessionRow key={item.id} session={item} showOutcome />)}</> : null}
    <View style={styles.card}><Link href="/community" asChild><Pressable accessibilityRole="button" style={styles.link}><T variant="button" color={colors.gold}>Find collaborators in Chat</T></Pressable></Link><Link href="/agenda" asChild><Pressable accessibilityRole="button" style={styles.link}><T variant="button" color={colors.gold}>Explore sessions</T></Pressable></Link></View>
  </Screen>;
}
function Notebook({ id, title }: { id: string; title: string }) {
  const [note, setNote] = useState(() => readWorkNote(webStorage(), id));
  const [status, setStatus] = useState("");
  function save() { const ok = saveWorkNote(webStorage(), id, note); setStatus(ok ? "Notebook saved on this device." : "Could not save here. Export a copy to keep your work."); return ok; }
  function download() {
    if (typeof document === "undefined") { setStatus("Export is available in the web app."); return; }
    const url = URL.createObjectURL(new Blob([workNoteText(title, note)], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `TATEL-${id.replace(/[^a-z0-9-]/gi, "-")}-notebook.txt`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <View style={styles.card}><T variant="title">{title}</T>{WORK_FIELDS.map(field => <View key={field.id} style={{ gap: 8 }}><T variant="rowTitle" color={colors.gold}>{field.label}</T><TextInput accessibilityLabel={field.label} placeholder={field.prompt} placeholderTextColor={colors.muted} value={note[field.id]} onChangeText={value => { setNote(current => ({ ...current, [field.id]: value })); setStatus("Unsaved changes"); }} multiline maxLength={4000} style={styles.input} /></View>)}
    <Pressable accessibilityRole="button" onPress={save} style={styles.primary}><T variant="button" color={colors.ink}>Save my notebook</T></Pressable>
    <Pressable accessibilityRole="button" onPress={download} style={styles.link}><T variant="button" color={colors.gold}>Export my notebook</T></Pressable>
    <T variant="small" accessibilityLiveRegion="polite">{status}</T>
  </View>;
}
const styles = StyleSheet.create({ card: { margin: 16, marginBottom: 4, padding: 18, gap: 16, borderRadius: 18, ...nightGlass }, link: { minHeight: 48, justifyContent: "center", paddingVertical: 10, gap: 5 }, primary: { minHeight: 48, borderRadius: 24, backgroundColor: colors.gold, padding: 14, alignItems: "center" }, input: { minHeight: 110, borderWidth: 1, borderColor: colors.gold, borderRadius: 12, padding: 14, color: colors.foam, fontSize: 17, lineHeight: 24, textAlignVertical: "top" } });
