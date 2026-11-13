import { describe, expect, it } from "vitest";
import { REEL_FALLBACK_MP4 } from "@/content/reels";
import { armReel, reelPlaybackSrc, type ReelMedia } from "./playback";

function fakeVideo(play: () => Promise<void> | undefined): ReelMedia & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    muted: false,
    playsInline: false,
    autoplay: false,
    src: "",
    setAttribute: (name) => calls.push(name),
    play: () => {
      calls.push("play");
      return play();
    },
  };
}

describe("reel playback", () => {
  it("uses each section film and the coastal loop only for an unknown id", () => {
    expect(reelPlaybackSrc("intro")).toBe("/reels/tatel-welcome-intro.mp4");
    expect(reelPlaybackSrc("tech")).toBe("/reels/tech.mp4");
    expect(reelPlaybackSrc("ai")).toBe("/reels/ai.mp4");
    expect(reelPlaybackSrc("sessions")).toBe("/reels/sessions.mp4");
    expect(reelPlaybackSrc("venues")).toBe("/reels/venues.mp4");
    expect(reelPlaybackSrc("stays")).toBe("/reels/stays.mp4");
    expect(reelPlaybackSrc("transport")).toBe("/reels/transport.mp4");
    expect(reelPlaybackSrc("community")).toBe("/reels/community.mp4");
    expect(reelPlaybackSrc("pass")).toBe("/reels/pass.mp4");
    expect(reelPlaybackSrc("missing")).toBe(REEL_FALLBACK_MP4);
  });

  it("calls play() synchronously after muting and setting the source", async () => {
    const video = fakeVideo(() => Promise.resolve());
    const pending = armReel(video, "/reels/tech.mp4");
    expect(video.calls).toContain("play");
    expect(video.muted).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(video.src).toBe("/reels/tech.mp4");
    expect(video.calls.indexOf("play")).toBeGreaterThan(-1);
    expect(video.calls).toEqual(expect.arrayContaining(["muted", "playsinline", "webkit-playsinline"]));
    await pending;
  });

  it("reloads before play so a stuck frame can start again", () => {
    const video = fakeVideo(() => Promise.resolve());
    video.load = () => video.calls.push("load");
    video.src = "/reels/tech.mp4";
    armReel(video, "/reels/tech.mp4");
    expect(video.calls.indexOf("load")).toBeGreaterThanOrEqual(0);
    expect(video.calls.indexOf("play")).toBeGreaterThan(video.calls.indexOf("load"));
  });

  it("returns the rejection so the player can show a play button", async () => {
    const video = fakeVideo(() => Promise.reject(new Error("NotAllowedError")));
    await expect(armReel(video, "/reels/law.mp4")).rejects.toThrow("NotAllowedError");
    expect(video.calls[video.calls.length - 1]).toBe("play");
  });
});
