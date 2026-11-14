import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  result: { data: [] as unknown, error: null as { message: string } | null },
  tables: [] as string[],
  inserts: [] as { table: string; payload: unknown }[],
  filters: [] as unknown[][],
  uploads: [] as string[],
}));

vi.mock("./client", () => {
  function query(table: string) {
    store.tables.push(table);
    const api = {
      select: () => api,
      order: () => api,
      limit: () => api,
      eq: (...args: unknown[]) => {
        store.filters.push(args);
        return api;
      },
      lt: (...args: unknown[]) => {
        store.filters.push(["lt", ...args]);
        return api;
      },
      insert: (payload: unknown) => {
        store.inserts.push({ table, payload });
        return api;
      },
      update: (payload: unknown) => {
        store.inserts.push({ table, payload });
        return api;
      },
      delete: () => api,
      upsert: (payload: unknown) => {
        store.inserts.push({ table, payload });
        return api;
      },
      single: () => Promise.resolve(store.result),
      then: (resolve: (value: typeof store.result) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(store.result).then(resolve, reject),
    };
    return api;
  }

  return {
    supabase: {
      from: (table: string) => query(table),
      storage: {
        from: () => ({
          upload: async (path: string) => {
            store.uploads.push(path);
            return { error: store.result.error };
          },
          getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/community-media/${path}` } }),
        }),
      },
    },
  };
});

import { createPost, explainCommunityError, listMessages, listPosts, profileLink, sendReport, uploadCommunityImage } from "./live";

describe("community live client", () => {
  beforeEach(() => {
    store.result = { data: [], error: null };
    store.tables = [];
    store.inserts = [];
    store.filters = [];
    store.uploads = [];
  });

  it("maps a post feed from the mocked client, newest page as returned", async () => {
    store.result = {
      error: null,
      data: [
        {
          id: "post-2",
          body: "Newest",
          photo_url: "https://cdn.test/a.jpg",
          hidden: false,
          created_at: "2026-11-10T12:00:00.000Z",
          author: { id: "user-1", display_name: "Ada", avatar_url: null, title: "Host", company: "TATEL" },
          community_likes: [{ user_id: "user-1" }],
          community_comments: [{ id: "c1" }],
        },
      ],
    };
    const posts = await listPosts("user-1");
    expect(store.tables).toContain("community_posts");
    expect(posts[0]).toMatchObject({
      id: "post-2",
      body: "Newest",
      photoUrl: "https://cdn.test/a.jpg",
      likeCount: 1,
      likedByMe: true,
      commentCount: 1,
      author: { displayName: "Ada", title: "Host", company: "TATEL" },
    });
  });

  it("accepts an https profile link and rejects other schemes", () => {
    expect(profileLink("  https://tatel.app/community ")).toBe("https://tatel.app/community");
    expect(profileLink("")).toBeNull();
    expect(() => profileLink("javascript:alert(1)")).toThrow(/https/);
  });

  it("inserts a post and turns a rate-limit error into a readable message", async () => {
    await createPost("user-1", "  See you on the dock  ");
    expect(store.inserts[0]).toEqual({
      table: "community_posts",
      payload: { author_id: "user-1", body: "See you on the dock", photo_url: null },
    });
    store.result = { data: null, error: { message: "community rate limit" } };
    await expect(createPost("user-1", "Again")).rejects.toThrow(/Slow down/);
  });

  it("pages chat history older than a cursor and keeps it chronological", async () => {
    store.result = {
      error: null,
      data: [
        { id: "m2", room_id: "room-general", body: "Later", hidden: false, created_at: "2026-11-10T12:02:00.000Z", author: { id: "a", display_name: "Ada" } },
        { id: "m1", room_id: "room-general", body: "Earlier", hidden: false, created_at: "2026-11-10T12:01:00.000Z", author: { id: "b", display_name: "Bea" } },
      ],
    };
    const page = await listMessages("room-general", "2026-11-10T12:03:00.000Z");
    expect(store.filters).toContainEqual(["room_id", "room-general"]);
    expect(store.filters).toContainEqual(["lt", "created_at", "2026-11-10T12:03:00.000Z"]);
    expect(page.map((message) => message.body)).toEqual(["Earlier", "Later"]);
  });

  it("uploads into the signed-in user's folder and explains offline or missing tables", async () => {
    const url = await uploadCommunityImage("user-1", new Blob(["x"]), "jpg");
    expect(store.uploads[0]).toMatch(/^user-1\/.+\.jpg$/);
    expect(url).toContain(store.uploads[0]);
    expect(explainCommunityError({ message: "Failed to fetch" })).toMatch(/offline/i);
    expect(explainCommunityError({ message: 'relation "community_posts" does not exist' })).toMatch(/not on the server yet/);
    store.result = { data: null, error: { message: "duplicate key value violates unique constraint" } };
    await expect(sendReport("user-1", "message", "m1", "Spam")).resolves.toBeUndefined();
  });
});
