import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAuth } from "@/community/auth";
import { communityPreviewEnabled } from "@/community/client";
import { supabase } from "@/community/client";
import { createPost, deletePost, explainCommunityError, hidePost, listPosts, sendReport, toggleLike, uploadCommunityImage } from "@/community/live";
import { pickCommunityPhoto } from "@/community/photo";
import { MemoryCommunity } from "@/community/memory";
import type { CommunityPost } from "@/community/types";
import { Screen } from "@/components/Screen";
import { T } from "@/components/Text";
import { colors, fonts, pad } from "@/theme";

export default function CommunityScreen() {
  const router = useRouter();
  const auth = useAuth();
  const preview = communityPreviewEnabled();
  const [memory] = useState(() => new MemoryCommunity());
  const [posts, setPosts] = useState<CommunityPost[]>(preview ? memory.listPosts() : []);
  const [draft, setDraft] = useState("");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<{ file: Blob; extension: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(async () => {
    if (preview) {
      setPosts(memory.listPosts());
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setOffline(true);
      return;
    }
    if (!auth.userId) return;
    try {
      setPosts(await listPosts(auth.userId));
      setOffline(false);
      setError(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : explainCommunityError({ message: "Community request failed" });
      if (/offline/i.test(message)) setOffline(true);
      else setError(message);
    }
  }, [auth.userId, memory, preview]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  useEffect(() => {
    if (preview || !auth.userId) return;
    const channel = supabase.channel("community-feed");
    channel.on("postgres_changes" as never, { event: "*", schema: "public", table: "community_posts" } as never, () => {
      refresh().catch(() => undefined);
    });
    channel.on("postgres_changes" as never, { event: "*", schema: "public", table: "community_likes" } as never, () => {
      refresh().catch(() => undefined);
    });
    channel.on("postgres_changes" as never, { event: "*", schema: "public", table: "community_comments" } as never, () => {
      refresh().catch(() => undefined);
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [auth.userId, preview, refresh]);

  async function publish() {
    if (!auth.userId) {
      router.push("/community-sign-in");
      return;
    }
    try {
      const photoUrl = !preview && photoFile ? await uploadCommunityImage(auth.userId, photoFile.file, photoFile.extension) : null;
      if (preview) memory.createPost(draft, photoName ? "preview" : null);
      else await createPost(auth.userId, draft, photoUrl);
      setDraft("");
      setPhotoFile(null);
      setPhotoName(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not post");
    }
  }

  return (
    <Screen>
      <View style={styles.pad}>
        <T variant="eyebrow">TATEL</T>
        <T variant="title">Community</T>
        <View style={styles.row}>
          <Link href="/community-room" asChild>
            <Pressable accessibilityRole="button" style={styles.link}>
              <T variant="small">Live chat</T>
            </Pressable>
          </Link>
          <Link href="/community-profile" asChild>
            <Pressable accessibilityRole="button" style={styles.link}>
              <T variant="small">Profile</T>
            </Pressable>
          </Link>
        </View>
        {preview ? <T variant="meta">Preview data. The live tables are applied separately.</T> : null}
      </View>
      {offline ? (
        <T variant="body" style={styles.pad}>Community is offline. The program is still available.</T>
      ) : !auth.ready ? null : !auth.userId ? (
        <View style={styles.pad}>
          <T variant="small">Sign in to read and post. A code comes by email.</T>
          <Pressable accessibilityRole="button" onPress={() => router.push("/community-sign-in")} style={styles.button}>
            <T variant="button" color={colors.ivory}>Sign in</T>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.pad}>
            <TextInput value={draft} onChangeText={setDraft} placeholder="Share a note" placeholderTextColor={colors.inkSoft} style={styles.input} multiline accessibilityLabel="Post" />
            <Pressable accessibilityRole="button" onPress={() => {
              pickCommunityPhoto().then((picked) => {
                setPhotoFile(picked);
                setPhotoName(picked ? "Photo attached" : null);
              }).catch(() => setError("Could not read that photo"));
            }} style={styles.link}>
              <T variant="small">{photoName ?? "Add photo"}</T>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={publish} style={styles.button}>
              <T variant="button" color={colors.ivory}>Post</T>
            </Pressable>
            {error ? <T variant="meta">{error}</T> : null}
          </View>
          {posts.map((post) => (
            <View key={post.id} style={styles.card}>
              <T variant="rowTitle">{post.author.displayName}</T>
              <T variant="meta">{[post.author.title, post.author.company].filter(Boolean).join(" · ")}</T>
              <T variant="small">{post.body}</T>
              {post.photoUrl && post.photoUrl !== "preview" ? (
                <Image source={{ uri: post.photoUrl }} style={styles.photo} accessibilityLabel="Post photo" />
              ) : null}
              <View style={styles.row}>
                <Pressable accessibilityRole="button" onPress={() => (preview ? (memory.toggleLike(post.id), refresh()) : toggleLike(auth.userId!, post.id, post.likedByMe).then(refresh))}>
                  <T variant="meta">{post.likedByMe ? "Liked" : "Like"} · {post.likeCount}</T>
                </Pressable>
                <Link href={{ pathname: "/community-post/[id]", params: { id: post.id } }} asChild>
                  <Pressable accessibilityRole="button"><T variant="meta">{post.commentCount} comments</T></Pressable>
                </Link>
                {(auth.staff || post.author.id === auth.userId) ? (
                  <Pressable accessibilityRole="button" onPress={() => (preview ? (memory.deletePost(post.id), refresh()) : deletePost(post.id).then(refresh))}>
                    <T variant="meta">Delete</T>
                  </Pressable>
                ) : null}
                {auth.staff ? (
                  <Pressable accessibilityRole="button" onPress={() => (preview ? (memory.hidePost(post.id), refresh()) : hidePost(post.id).then(refresh))}>
                    <T variant="meta">Hide</T>
                  </Pressable>
                ) : (
                  <Pressable accessibilityRole="button" onPress={() => (preview ? memory.report("post", post.id, "Review") : sendReport(auth.userId!, "post", post.id, "Please review this post"))}>
                    <T variant="meta">Report</T>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: pad, paddingBottom: 12, gap: 8 },
  row: { flexDirection: "row", gap: 16, alignItems: "center" },
  link: { paddingVertical: 6 },
  input: { minHeight: 72, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperRaised, color: colors.ink, fontFamily: fonts.body, fontSize: 16, padding: 12 },
  button: { backgroundColor: colors.ink, minHeight: 44, alignItems: "center", justifyContent: "center" },
  photo: { width: "100%", height: 180, backgroundColor: colors.muted },
  card: { marginHorizontal: pad, marginBottom: 10, padding: 12, gap: 4, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperRaised },
});
