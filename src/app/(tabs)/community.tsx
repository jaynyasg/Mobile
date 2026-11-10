import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { commentLabel } from "@/community/copy";
import { useAuth } from "@/community/auth";
import { communityPreviewEnabled } from "@/community/client";
import { supabase } from "@/community/client";
import { createPost, deletePost, explainCommunityError, hidePost, listPosts, sendReport, toggleLike, uploadCommunityImage } from "@/community/live";
import { pickCommunityPhoto } from "@/community/photo";
import { MemoryCommunity } from "@/community/memory";
import type { CommunityPost } from "@/community/types";
import { Glass } from "@/components/Glass";
import { Screen } from "@/components/Screen";
import { T } from "@/components/Text";
import { colors, fonts, pad, scenePhotos } from "@/theme";

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
    <Screen docked photo={scenePhotos.community}>
      <View style={styles.pad}>
        <T variant="eyebrow" color={colors.gold}>TATEL</T>
        <T variant="title" color={colors.onDark}>Community</T>
        <View style={styles.row}>
          <Link href="/community-room" asChild>
            <Pressable accessibilityRole="button" style={styles.pill}>
              <View style={styles.dot} />
              <T variant="small" color={colors.ivory}>Live chat</T>
            </Pressable>
          </Link>
          <Link href="/community-profile" asChild>
            <Pressable accessibilityRole="button" style={styles.link}>
              <T variant="small">Profile</T>
            </Pressable>
          </Link>
        </View>
        {preview ? <T variant="meta" color={colors.onDarkSoft}>Preview</T> : null}
      </View>
      {offline ? (
        <T variant="body" style={styles.pad}>Community is offline. The program is still available.</T>
      ) : !auth.ready ? null : !auth.userId ? (
        <View style={styles.pad}>
          <T variant="small" color={colors.onDark}>Sign in to read and post.</T>
          <Pressable accessibilityRole="button" onPress={() => router.push("/community-sign-in")} style={styles.button}>
            <T variant="button" color={colors.ink}>Sign in</T>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.pad}>
            <TextInput value={draft} onChangeText={setDraft} placeholder="Share a note" placeholderTextColor={colors.onDarkSoft} style={styles.input} multiline accessibilityLabel="Post" />
            <Pressable accessibilityRole="button" onPress={() => {
              pickCommunityPhoto().then((picked) => {
                setPhotoFile(picked);
                setPhotoName(picked ? "Photo attached" : null);
              }).catch(() => setError("Could not read that photo"));
            }} style={styles.link}>
              <T variant="small">{photoName ?? "Add photo"}</T>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={publish} style={styles.button}>
              <T variant="button" color={colors.ink}>Post</T>
            </Pressable>
            {error ? <T variant="meta">{error}</T> : null}
          </View>
          {posts.map((post) => (
            <Glass key={post.id} style={styles.card}>
              <View style={styles.person}>
                <View style={styles.avatar}><T variant="meta" color={colors.ivory}>{initials(post.author.displayName)}</T></View>
                <View style={styles.copy}>
                  <T variant="rowTitle">{post.author.displayName}</T>
                  <T variant="meta">{[post.author.title, post.author.company].filter(Boolean).join(" · ")}</T>
                </View>
              </View>
              <T variant="small">{post.body}</T>
              {post.photoUrl && post.photoUrl !== "preview" ? (
                <Image source={{ uri: post.photoUrl }} style={styles.photo} accessibilityLabel="Post photo" />
              ) : null}
              <View style={styles.row}>
                <Pressable accessibilityRole="button" onPress={() => (preview ? (memory.toggleLike(post.id), refresh()) : toggleLike(auth.userId!, post.id, post.likedByMe).then(refresh))}>
                  <T variant="meta">{post.likedByMe ? "Liked" : "Like"} · {post.likeCount}</T>
                </Pressable>
                <Link href={{ pathname: "/community-post/[id]", params: { id: post.id } }} asChild>
                  <Pressable accessibilityRole="button"><T variant="meta" color={colors.turquoise}>{commentLabel(post.commentCount)}</T></Pressable>
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
            </Glass>
          ))}
        </>
      )}
    </Screen>
  );
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: pad, paddingBottom: 12, gap: 8 },
  row: { flexDirection: "row", gap: 16, alignItems: "center" },
  link: { paddingVertical: 6 },
  input: { minHeight: 64, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(247,244,239,0.45)", borderRadius: 14, backgroundColor: "rgba(6,14,24,0.72)", color: colors.onDark, fontFamily: fonts.body, fontSize: 16, padding: 12 },
  button: { backgroundColor: colors.gold, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  photo: { width: "100%", height: 180, borderRadius: 14, backgroundColor: colors.muted },
  card: { marginHorizontal: 22, marginBottom: 18, gap: 6, backgroundColor: "rgba(255,255,255,0.84)" },
  person: { flexDirection: "row", gap: 10, alignItems: "center" },
  copy: { flex: 1, gap: 2 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.turquoise, alignItems: "center", justifyContent: "center" },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.turquoise, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ivory },
});
