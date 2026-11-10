export type RoomKind = "general" | "island" | "session";

export interface CommunityProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  title: string | null;
  company: string | null;
  staff: boolean;
}

export interface CommunityRoom {
  id: string;
  slug: string;
  name: string;
  kind: RoomKind;
  scopeId: string | null;
}

export interface CommunityPost {
  id: string;
  author: CommunityProfile;
  body: string;
  photoUrl: string | null;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  hidden: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  author: CommunityProfile;
  body: string;
  createdAt: string;
  hidden: boolean;
}

export interface CommunityMessage {
  id: string;
  roomId: string;
  author: CommunityProfile;
  body: string;
  createdAt: string;
  hidden: boolean;
}
