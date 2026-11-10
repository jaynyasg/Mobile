import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MemoryCommunity } from "./memory";

describe("community memory store", () => {
  it("lists posts newest first and refuses a signed-out writer", () => {
    const signedOut = new MemoryCommunity({ signedIn: false });
    expect(() => signedOut.listPosts()).toThrow(/Sign in/);
    const community = new MemoryCommunity();
    const posts = community.listPosts();
    expect(posts.map((post) => post.id)).toEqual(["post-2", "post-1"]);
    const created = community.createPost("See you on the dock");
    expect(community.listPosts()[0]?.id).toBe(created.id);
  });

  it("likes, comments, reports, and blocks removing someone else's post", () => {
    const community = new MemoryCommunity();
    community.actor = {
      profile: { ...community.actor!.profile, id: "visitor", staff: false, displayName: "Visitor" },
    };
    community.toggleLike("post-1");
    expect(community.posts.find((post) => post.id === "post-1")?.likedByMe).toBe(true);
    community.addComment("post-1", "Count me in");
    expect(community.listComments("post-1").at(-1)?.body).toBe("Count me in");
    community.report("post", "post-1", "Spam");
    expect(community.reports).toHaveLength(1);
    expect(() => community.deletePost("post-1")).toThrow(/Not allowed/);
    const mine = community.addComment("post-1", "My note");
    community.deleteComment(mine.id);
    expect(community.listComments("post-1").some((comment) => comment.id === mine.id)).toBe(false);
  });

  it("keeps older chat history behind the latest page", () => {
    const community = new MemoryCommunity();
    for (let index = 0; index < 45; index += 1) {
      community.messages.push({
        id: `old-${index}`,
        roomId: community.room.id,
        author: community.actor!.profile,
        body: `Earlier ${index}`,
        createdAt: new Date(Date.now() - (50 - index) * 60_000).toISOString(),
        hidden: false,
      });
    }
    const latest = community.listMessages();
    expect(latest).toHaveLength(40);
    const cursor = latest[0]?.createdAt;
    expect(cursor).toBeTruthy();
    const older = community.listMessages(cursor);
    expect(older.length).toBeGreaterThan(0);
    expect((older.at(-1)?.createdAt ?? "") < (cursor ?? "")).toBe(true);
    expect(community.room.kind).toBe("general");
  });
});

describe("community sql", () => {
  const sql = readFileSync(new URL("../../supabase/community.sql", import.meta.url), "utf8");

  it("gates every policy through one function and leaves existing tables alone", () => {
    expect(sql).toContain("community_can_participate");
    expect(sql).toContain("rsvp_requests");
    expect(sql).toMatch(/values \('general', 'Everyone', 'general'\)/);
    const policies = sql.match(/create policy [\s\S]*?;/g) ?? [];
    expect(policies.length).toBeGreaterThan(10);
    for (const policy of policies) {
      if (policy.includes("community_media_read") || policy.includes("community_media_update") || policy.includes("community_media_delete")) {
        continue;
      }
      expect(policy).toContain("community_can_participate");
    }
    expect(sql).not.toMatch(/drop table public\.(app_settings|rsvp_requests|user_roles|vessel_generations)/i);
    expect(sql).not.toMatch(/alter table public\.(app_settings|rsvp_requests|user_roles)/i);
  });
});
