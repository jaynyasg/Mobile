import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAuth } from "@/community/auth";
import { communityPreviewEnabled, supabase } from "@/community/client";
import { deleteMessage, generalRoom, hideMessage, listMessages, sendMessage, sendReport } from "@/community/live";
import { MemoryCommunity } from "@/community/memory";
import type { CommunityMessage } from "@/community/types";
import { ChatImages } from "@/components/ChatImages";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { backgrounds } from "@/components/backgrounds";
import { colors, fonts, pad } from "@/theme";
import { nightGlass } from "@/components/nightGlass";

export default function CommunityRoomScreen() {
  const auth = useAuth();
  const preview = communityPreviewEnabled();
  const [memory] = useState(() => new MemoryCommunity());
  const [roomId, setRoomId] = useState(preview ? memory.room.id : "");
  const [messages, setMessages] = useState<CommunityMessage[]>(preview ? memory.listMessages() : []);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<FlatList<CommunityMessage>>(null);
  const pinned = useRef(true);
  const loadingOlder = useRef(false);

  const load = useCallback(async (before?: string) => {
    if (preview) {
      if (!before) setMessages(memory.listMessages());
      else {
        const older = memory.listMessages(before);
        if (older.length < 40) setHasMore(false);
        if (older.length) setMessages((current) => [...older.filter((item) => !current.some((row) => row.id === item.id)), ...current]);
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setOffline(true);
      return;
    }
    if (!auth.userId) return;
    const room = roomId || (await generalRoom()).id;
    setRoomId(room);
    const page = await listMessages(room, before);
    if (before && page.length < 40) setHasMore(false);
    setMessages((current) => {
      if (!before) {
        const known = new Set(page.map((item) => item.id));
        const older = current.filter((item) => !known.has(item.id) && item.createdAt < (page[0]?.createdAt ?? item.createdAt));
        return [...older, ...page];
      }
      const known = new Set(current.map((item) => item.id));
      return [...page.filter((item) => !known.has(item.id)), ...current];
    });
    setOffline(false);
  }, [auth.userId, memory, preview, roomId]);

  useEffect(() => {
    load().catch((cause) => setError(cause instanceof Error ? cause.message : "Chat is unavailable"));
  }, [load]);

  useEffect(() => {
    if (preview || !roomId) return;
    const channel = supabase.channel(`community-room-${roomId}`);
    channel.on(
      "postgres_changes" as never,
      { event: "INSERT", schema: "public", table: "community_messages", filter: `room_id=eq.${roomId}` } as never,
      () => {
        load().catch(() => undefined);
      },
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, preview, roomId]);

  async function send() {
    if (!auth.userId) return;
    if (preview) {
      memory.sendMessage(draft);
      setDraft("");
      setMessages(memory.listMessages());
      return;
    }
    await sendMessage(auth.userId, roomId, draft);
    setDraft("");
    await load();
  }

  return (
    <Screen edge="none" scroll={false} photo={backgrounds.chat.day} night={backgrounds.chat.night} phase={backgrounds.chat.phase}>
      <StackHeader title="Everyone" />
      {offline ? <T variant="body" style={styles.note}>Community is offline. The program is still available.</T> : null}
      {!auth.userId && !preview ? <T variant="body" style={styles.note}>Sign in to read the room.</T> : null}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.flex}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => {
          if (pinned.current) listRef.current?.scrollToEnd({ animated: false });
        }}
        onScroll={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          const atBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 48;
          pinned.current = atBottom;
          if (contentOffset.y > 32 || atBottom || !hasMore || messages.length < 40 || loadingOlder.current) return;
          const oldest = messages[0]?.createdAt;
          if (!oldest) return;
          loadingOlder.current = true;
          pinned.current = false;
          load(oldest).catch(() => undefined).finally(() => {
            loadingOlder.current = false;
          });
        }}
        scrollEventThrottle={200}
        renderItem={({ item }) => (
          <View style={styles.bubble}>
            <T variant="meta" color={colors.turquoise}>{item.author.displayName}</T>
            <T variant="small">{item.body}</T>
            <ChatImages text={item.body} photoUrl={item.photoUrl} label={`Photo from ${item.author.displayName}`} />
            <View style={styles.actions}>
              {auth.staff || item.author.id === auth.userId ? (
                <Pressable accessibilityRole="button" onPress={() => {
                  if (preview) {
                    memory.deleteMessage(item.id);
                    setMessages(memory.listMessages());
                  } else deleteMessage(item.id).then(() => load()).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not delete"));
                }}>
                  <T variant="meta">Delete</T>
                </Pressable>
              ) : null}
              {auth.staff ? (
                <Pressable accessibilityRole="button" onPress={() => {
                  if (preview) {
                    memory.hideMessage(item.id);
                    setMessages(memory.listMessages());
                  } else hideMessage(item.id).then(() => load()).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not hide"));
                }}>
                  <T variant="meta">Hide</T>
                </Pressable>
              ) : auth.userId ? (
                <Pressable accessibilityRole="button" onPress={() => {
                  if (preview) memory.report("message", item.id, "Review");
                  else sendReport(auth.userId!, "message", item.id, "Please review this message").catch((cause) => setError(cause instanceof Error ? cause.message : "Could not report"));
                }}>
                  <T variant="meta">Report</T>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput value={draft} onChangeText={setDraft} placeholder="Message everyone" placeholderTextColor="rgba(245,241,232,0.62)" style={styles.input} accessibilityLabel="Message" />
        <Pressable accessibilityRole="button" onPress={() => send().catch((cause) => setError(cause instanceof Error ? cause.message : "Could not send"))} style={styles.send}>
          <T variant="button" color={colors.ink}>Send</T>
        </Pressable>
      </View>
      {error ? <T variant="meta" style={styles.note}>{error}</T> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  note: { padding: pad },
  list: { padding: pad, gap: 8 },
  bubble: { alignSelf: "flex-start", maxWidth: "88%", padding: 12, borderRadius: 16, ...nightGlass, gap: 2 },
  actions: { flexDirection: "row", gap: 16 },
  composer: { flexDirection: "row", gap: 8, padding: pad },
  input: { flex: 1, borderWidth: 1, borderColor: "rgba(255,224,138,0.42)", borderRadius: 14, backgroundColor: "rgba(7,27,42,0.72)", color: colors.foam, fontFamily: fonts.body, fontSize: 16, paddingHorizontal: 12 },
  send: { backgroundColor: colors.gold, borderRadius: 14, paddingHorizontal: 14, justifyContent: "center" },
});
