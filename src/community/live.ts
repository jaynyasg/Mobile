import { supabase } from "./client";
import { assertLength, communityLimits } from "./limits";
import type { CommunityComment, CommunityMessage, CommunityPost, CommunityProfile, CommunityRoom } from "./types";

type Row = Record<string, unknown>;

function profileOf(row: Row | null): CommunityProfile {
  const source = row ?? {};
  return {
    id: String(source.id ?? ""),
    displayName: String(source.display_name ?? "Member"),
    avatarUrl: typeof source.avatar_url === "string" ? source.avatar_url : null,
    title: typeof source.title === "string" ? source.title : null,
    company: typeof source.company === "string" ? source.company : null,
    staff: false,
  };
}

export function explainCommunityError(error: { message?: string } | null): string {
  const message = error?.message ?? "Community request failed";
  if (/does not exist|schema cache|relation/i.test(message)) return "Community is not on the server yet.";
  if (/rate limit/i.test(message)) return "Slow down for a minute, then try again.";
  if (/fetch|network|offline/i.test(message)) return "Community is offline. The program is still available.";
  return message;
}

export async function ensureProfile(userId: string, email: string | null): Promise<void> {
  const fallback = (email ?? "member").split("@")[0]?.slice(0, communityLimits.name) || "Member";
  const { error } = await supabase.from("community_profiles").upsert({ id: userId, display_name: fallback }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(explainCommunityError(error));
}

export async function saveProfile(
  userId: string,
  input: { displayName: string; title: string; company: string; avatarUrl?: string | null },
): Promise<void> {
  const patch: Record<string, string | null> = {
    display_name: assertLength(input.displayName, communityLimits.name, "Name"),
    title: input.title.trim().slice(0, communityLimits.title) || null,
    company: input.company.trim().slice(0, communityLimits.company) || null,
  };
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
  const { error } = await supabase.from("community_profiles").update(patch).eq("id", userId);
  if (error) throw new Error(explainCommunityError(error));
}

export async function listPosts(userId: string): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from("community_posts")
    .select("id, body, photo_url, hidden, created_at, author:community_profiles!author_id(id, display_name, avatar_url, title, company), community_likes(user_id), community_comments(id)")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw new Error(explainCommunityError(error));
  return (data ?? []).map((row) => {
    const record = row as Row;
    const likes = Array.isArray(record.community_likes) ? (record.community_likes as Row[]) : [];
    const comments = Array.isArray(record.community_comments) ? record.community_comments : [];
    return {
      id: String(record.id),
      author: profileOf(record.author as Row),
      body: String(record.body ?? ""),
      photoUrl: typeof record.photo_url === "string" ? record.photo_url : null,
      createdAt: String(record.created_at),
      likeCount: likes.length,
      likedByMe: likes.some((like) => like.user_id === userId),
      commentCount: comments.length,
      hidden: record.hidden === true,
    };
  });
}

export async function createPost(userId: string, body: string, photoUrl?: string | null): Promise<void> {
  const { error } = await supabase.from("community_posts").insert({
    author_id: userId,
    body: assertLength(body, communityLimits.post, "Post"),
    photo_url: photoUrl ?? null,
  });
  if (error) throw new Error(explainCommunityError(error));
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("community_posts").delete().eq("id", id);
  if (error) throw new Error(explainCommunityError(error));
}

export async function hidePost(id: string): Promise<void> {
  const { error } = await supabase.from("community_posts").update({ hidden: true }).eq("id", id);
  if (error) throw new Error(explainCommunityError(error));
}

export async function toggleLike(userId: string, postId: string, liked: boolean): Promise<void> {
  const query = liked
    ? supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", userId)
    : supabase.from("community_likes").insert({ post_id: postId, user_id: userId });
  const { error } = await query;
  if (error) throw new Error(explainCommunityError(error));
}

export async function listComments(postId: string): Promise<CommunityComment[]> {
  const { data, error } = await supabase
    .from("community_comments")
    .select("id, post_id, body, hidden, created_at, author:community_profiles!author_id(id, display_name, avatar_url, title, company)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(explainCommunityError(error));
  return (data ?? []).map((row) => {
    const record = row as Row;
    return {
      id: String(record.id),
      postId: String(record.post_id),
      author: profileOf(record.author as Row),
      body: String(record.body ?? ""),
      createdAt: String(record.created_at),
      hidden: record.hidden === true,
    };
  });
}

export async function addComment(userId: string, postId: string, body: string): Promise<void> {
  const { error } = await supabase.from("community_comments").insert({
    author_id: userId,
    post_id: postId,
    body: assertLength(body, communityLimits.comment, "Comment"),
  });
  if (error) throw new Error(explainCommunityError(error));
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from("community_comments").delete().eq("id", id);
  if (error) throw new Error(explainCommunityError(error));
}

export async function hideComment(id: string): Promise<void> {
  const { error } = await supabase.from("community_comments").update({ hidden: true }).eq("id", id);
  if (error) throw new Error(explainCommunityError(error));
}

export async function sendReport(userId: string, type: "post" | "comment" | "message", targetId: string, reason: string): Promise<void> {
  const { error } = await supabase.from("community_reports").insert({
    reporter_id: userId,
    target_type: type,
    target_id: targetId,
    reason: assertLength(reason, communityLimits.report, "Report"),
  });
  if (error && !/duplicate|unique/i.test(error.message)) throw new Error(explainCommunityError(error));
}

export async function generalRoom(): Promise<CommunityRoom> {
  const { data, error } = await supabase.from("community_rooms").select("id, slug, name, kind, scope_id").eq("slug", "general").single();
  if (error) throw new Error(explainCommunityError(error));
  return { id: data.id, slug: data.slug, name: data.name, kind: data.kind, scopeId: data.scope_id };
}

export async function listMessages(roomId: string, before?: string): Promise<CommunityMessage[]> {
  let query = supabase
    .from("community_messages")
    .select("id, room_id, body, hidden, created_at, author:community_profiles!author_id(id, display_name, avatar_url, title, company)")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (before) query = query.lt("created_at", before);
  const { data, error } = await query;
  if (error) throw new Error(explainCommunityError(error));
  return (data ?? [])
    .map((row) => {
      const record = row as Row;
      return {
        id: String(record.id),
        roomId: String(record.room_id),
        author: profileOf(record.author as Row),
        body: String(record.body ?? ""),
        createdAt: String(record.created_at),
        hidden: record.hidden === true,
      };
    })
    .reverse();
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase.from("community_messages").delete().eq("id", id);
  if (error) throw new Error(explainCommunityError(error));
}

export async function hideMessage(id: string): Promise<void> {
  const { error } = await supabase.from("community_messages").update({ hidden: true }).eq("id", id);
  if (error) throw new Error(explainCommunityError(error));
}

export async function sendMessage(userId: string, roomId: string, body: string): Promise<void> {
  const { error } = await supabase.from("community_messages").insert({
    author_id: userId,
    room_id: roomId,
    body: assertLength(body, communityLimits.message, "Message"),
  });
  if (error) throw new Error(explainCommunityError(error));
}

export async function uploadCommunityImage(userId: string, file: Blob, extension: string): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("community-media").upload(path, file, { upsert: false });
  if (error) throw new Error(explainCommunityError(error));
  return supabase.storage.from("community-media").getPublicUrl(path).data.publicUrl;
}
