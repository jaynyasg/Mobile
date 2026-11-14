import { canParticipate, canRemove } from "./access";
import { assertLength, communityLimits } from "./limits";
import type { CommunityComment, CommunityMessage, CommunityPost, CommunityProfile, CommunityRoom } from "./types";

interface Actor {
  profile: CommunityProfile;
}

function stamp(offsetMs: number): string {
  return new Date(Date.now() - offsetMs).toISOString();
}

export function previewActor(): Actor {
  return {
    profile: {
      id: "preview-you",
      displayName: "Jordan Hale",
      avatarUrl: null,
      title: "Guest",
      company: "Harbor",
      bio: "Here for the conversations.",
      link: null,
      staff: true,
    },
  };
}

export function previewRoom(): CommunityRoom {
  return { id: "room-general", slug: "general", name: "Everyone", kind: "general", scopeId: null };
}

const mara: CommunityProfile = {
  id: "preview-mara",
  displayName: "Mara Cole",
  avatarUrl: null,
  title: "Skipper",
  company: "North Light",
  bio: "Crossing with the morning boat.",
  link: "https://tatel.app",
  staff: false,
};

export function previewPosts(): CommunityPost[] {
  return [
    {
      id: "post-1",
      author: mara,
      body: "The dock at Red Hook is easy to find. Save a seat on the morning boat if you are crossing.",
      photoUrl: "/venues/hideout-white-bay/img_2673-1280.webp",
      createdAt: stamp(20 * 60_000),
      likeCount: 3,
      likedByMe: false,
      commentCount: 1,
      hidden: false,
    },
    {
      id: "post-2",
      author: previewActor().profile,
      body: "Preview post. Likes and comments stay in this demo until the community tables are applied.",
      photoUrl: null,
      createdAt: stamp(5 * 60_000),
      likeCount: 1,
      likedByMe: true,
      commentCount: 0,
      hidden: false,
    },
  ];
}

export function previewComments(): CommunityComment[] {
  return [
    {
      id: "comment-1",
      postId: "post-1",
      author: previewActor().profile,
      body: "Thanks. I will look for the morning boat.",
      createdAt: stamp(10 * 60_000),
      hidden: false,
    },
  ];
}

export function previewMessages(): CommunityMessage[] {
  const roomId = previewRoom().id;
  return [
    { id: "msg-1", roomId, author: mara, body: "Anyone already on island?", photoUrl: "/venues/hideout-white-bay/img_2674-1280.webp", createdAt: stamp(30 * 60_000), hidden: false },
    { id: "msg-2", roomId, author: previewActor().profile, body: "Landing this afternoon.", createdAt: stamp(12 * 60_000), hidden: false },
  ];
}

export class MemoryCommunity {
  actor: Actor | null;
  room = previewRoom();
  posts: CommunityPost[];
  comments: CommunityComment[];
  messages: CommunityMessage[];
  reports: { type: string; id: string; reporterId: string; reason: string }[] = [];

  constructor(seed?: { signedIn?: boolean }) {
    this.actor = seed?.signedIn === false ? null : previewActor();
    this.posts = previewPosts();
    this.comments = previewComments();
    this.messages = previewMessages();
  }

  private requireActor(): CommunityProfile {
    if (!canParticipate(this.actor?.profile.id)) throw new Error("Sign in to take part");
    return this.actor!.profile;
  }

  private rate(kind: "post" | "comment" | "message", authorId: string) {
    const cutoff = Date.now() - 60_000;
    const recent =
      kind === "post"
        ? this.posts.filter((item) => item.author.id === authorId && Date.parse(item.createdAt) > cutoff).length
        : kind === "comment"
          ? this.comments.filter((item) => item.author.id === authorId && Date.parse(item.createdAt) > cutoff).length
          : this.messages.filter((item) => item.author.id === authorId && Date.parse(item.createdAt) > cutoff).length;
    if (recent >= communityLimits.perMinute && !this.actor?.profile.staff) throw new Error("community rate limit");
  }

  listPosts(): CommunityPost[] {
    this.requireActor();
    return this.posts
      .filter((post) => !post.hidden || post.author.id === this.actor?.profile.id || this.actor?.profile.staff)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createPost(body: string, photoUrl?: string | null): CommunityPost {
    const actor = this.requireActor();
    this.rate("post", actor.id);
    const post: CommunityPost = {
      id: `post-${this.posts.length + 1}`,
      author: actor,
      body: assertLength(body, communityLimits.post, "Post"),
      photoUrl: photoUrl ?? null,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      likedByMe: false,
      commentCount: 0,
      hidden: false,
    };
    this.posts.push(post);
    return post;
  }

  deletePost(id: string) {
    const actor = this.requireActor();
    const post = this.posts.find((item) => item.id === id);
    if (!post || !canRemove(post.author.id, actor.id, actor.staff)) throw new Error("Not allowed");
    this.posts = this.posts.filter((item) => item.id !== id);
  }

  hidePost(id: string) {
    const actor = this.requireActor();
    if (!actor.staff) throw new Error("Not allowed");
    const post = this.posts.find((item) => item.id === id);
    if (post) post.hidden = true;
  }

  toggleLike(postId: string) {
    const actor = this.requireActor();
    const post = this.posts.find((item) => item.id === postId);
    if (!post) throw new Error("Missing post");
    post.likedByMe = !post.likedByMe;
    post.likeCount += post.likedByMe ? 1 : -1;
    void actor;
  }

  listComments(postId: string): CommunityComment[] {
    this.requireActor();
    return this.comments
      .filter((comment) => comment.postId === postId && (!comment.hidden || this.actor?.profile.staff))
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  addComment(postId: string, body: string): CommunityComment {
    const actor = this.requireActor();
    this.rate("comment", actor.id);
    const comment: CommunityComment = {
      id: `comment-${this.comments.length + 1}`,
      postId,
      author: actor,
      body: assertLength(body, communityLimits.comment, "Comment"),
      createdAt: new Date().toISOString(),
      hidden: false,
    };
    this.comments.push(comment);
    const post = this.posts.find((item) => item.id === postId);
    if (post) post.commentCount += 1;
    return comment;
  }

  deleteComment(id: string) {
    const actor = this.requireActor();
    const comment = this.comments.find((item) => item.id === id);
    if (!comment || !canRemove(comment.author.id, actor.id, actor.staff)) throw new Error("Not allowed");
    this.comments = this.comments.filter((item) => item.id !== id);
  }

  hideComment(id: string) {
    const actor = this.requireActor();
    if (!actor.staff) throw new Error("Not allowed");
    const comment = this.comments.find((item) => item.id === id);
    if (comment) comment.hidden = true;
  }

  report(type: "post" | "comment" | "message", id: string, reason: string) {
    const actor = this.requireActor();
    const clean = assertLength(reason, communityLimits.report, "Report");
    if (this.reports.some((item) => item.type === type && item.id === id && item.reporterId === actor.id)) return;
    this.reports.push({ type, id, reporterId: actor.id, reason: clean });
  }

  listMessages(before?: string): CommunityMessage[] {
    this.requireActor();
    const visible = this.messages
      .filter((message) => message.roomId === this.room.id && (!message.hidden || this.actor?.profile.staff))
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (!before) return visible.slice(-40);
    return visible.filter((message) => message.createdAt < before).slice(-40);
  }

  deleteMessage(id: string) {
    const actor = this.requireActor();
    const message = this.messages.find((item) => item.id === id);
    if (!message || !canRemove(message.author.id, actor.id, actor.staff)) throw new Error("Not allowed");
    this.messages = this.messages.filter((item) => item.id !== id);
  }

  hideMessage(id: string) {
    const actor = this.requireActor();
    if (!actor.staff) throw new Error("Not allowed");
    const message = this.messages.find((item) => item.id === id);
    if (message) message.hidden = true;
  }

  sendMessage(body: string): CommunityMessage {
    const actor = this.requireActor();
    this.rate("message", actor.id);
    const message: CommunityMessage = {
      id: `msg-${this.messages.length + 1}`,
      roomId: this.room.id,
      author: actor,
      body: assertLength(body, communityLimits.message, "Message"),
      createdAt: new Date().toISOString(),
      hidden: false,
    };
    this.messages.push(message);
    return message;
  }
}
