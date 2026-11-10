import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAuth } from "@/community/auth";
import { communityPreviewEnabled } from "@/community/client";
import { addComment, deleteComment, hideComment, listComments, sendReport } from "@/community/live";
import { MemoryCommunity } from "@/community/memory";
import type { CommunityComment } from "@/community/types";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { colors, fonts, pad, scenePhotos } from "@/theme";

export default function CommentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const auth = useAuth();
  const preview = communityPreviewEnabled();
  const [memory] = useState(() => new MemoryCommunity());
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!id) return;
    if (preview) {
      setComments(memory.listComments(id));
      return;
    }
    if (!auth.userId) return;
    setComments(await listComments(id));
  }

  useEffect(() => {
    refresh().catch((cause) => setError(cause instanceof Error ? cause.message : "Comments are unavailable"));
  }, [id, auth.userId]);

  return (
    <Screen edge="none" photo={scenePhotos.community}>
      <StackHeader title="Comments" />
      {!auth.userId && !preview ? <T variant="body" style={styles.pad}>Sign in to read comments.</T> : null}
      {comments.map((comment) => (
        <View key={comment.id} style={styles.card}>
          <T variant="rowTitle">{comment.author.displayName}</T>
          <T variant="small">{comment.body}</T>
          <View style={styles.row}>
            {auth.staff || comment.author.id === auth.userId ? (
              <Pressable accessibilityRole="button" onPress={() => {
                if (preview) memory.deleteComment(comment.id);
                else deleteComment(comment.id).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not delete"));
                refresh().catch(() => undefined);
              }}>
                <T variant="meta">Delete</T>
              </Pressable>
            ) : null}
            {auth.staff ? (
              <Pressable accessibilityRole="button" onPress={() => {
                if (preview) memory.hideComment(comment.id);
                else hideComment(comment.id).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not hide"));
                refresh().catch(() => undefined);
              }}>
                <T variant="meta">Hide</T>
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => {
                if (!auth.userId) return;
                if (preview) memory.report("comment", comment.id, "Review");
                else sendReport(auth.userId, "comment", comment.id, "Please review this comment").catch((cause) => setError(cause instanceof Error ? cause.message : "Could not report"));
              }}>
                <T variant="meta">Report</T>
              </Pressable>
            )}
          </View>
        </View>
      ))}
      <View style={styles.pad}>
        <TextInput value={draft} onChangeText={setDraft} placeholder="Add a comment" placeholderTextColor={colors.inkSoft} style={styles.input} accessibilityLabel="Comment" />
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => {
          if (!auth.userId || !id) return;
          const write = preview ? Promise.resolve(memory.addComment(id, draft)) : addComment(auth.userId, id, draft);
          write.then(() => { setDraft(""); return refresh(); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not comment"));
        }}>
          <T variant="button" color={colors.ink}>Comment</T>
        </Pressable>
        {error ? <T variant="meta">{error}</T> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: pad, gap: 8 },
  card: { marginHorizontal: 22, marginBottom: 14, padding: 14, gap: 4, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.62)", borderWidth: 1, borderColor: "rgba(255,224,138,0.55)" },
  row: { flexDirection: "row", gap: 16 },
  input: { borderWidth: 1, borderColor: colors.line, color: colors.ink, fontFamily: fonts.body, fontSize: 16, padding: 12 },
  button: { backgroundColor: colors.gold, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 16 },
});
