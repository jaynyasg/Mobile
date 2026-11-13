import { REEL_FALLBACK_MP4, reels, zoneReelIds, type ReelId } from "@/content/reels";

/** Films that exist under public/reels/. Other chapters stand in with the coastal loop. */
const OWN_FILM = new Set<string>(["intro", ...zoneReelIds]);

export interface ReelMedia {
  muted: boolean;
  defaultMuted?: boolean;
  playsInline: boolean;
  autoplay: boolean;
  src: string;
  setAttribute: (name: string, value: string) => void;
  play: () => Promise<void> | undefined;
}

/** A chapter with no film of its own plays the coastal loop instead of a missing file. */
export function reelPlaybackSrc(id: string): string {
  if (OWN_FILM.has(id)) return reels[id as ReelId].mp4;
  return REEL_FALLBACK_MP4;
}

/**
 * Start muted inline playback. Call this inside the tap so the play() call
 * stays on the user-gesture stack.
 */
export function armReel(video: ReelMedia, src: string): Promise<void> {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  if (!sameSrc(video.src, src)) video.src = src;
  const attempt = video.play();
  return attempt ?? Promise.resolve();
}

function sameSrc(current: string, next: string): boolean {
  return current === next || current.endsWith(next);
}

let shared: HTMLVideoElement | null = null;

export function reelVideoElement(): HTMLVideoElement | null {
  if (typeof document === "undefined") return null;
  if (!shared) {
    const video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = "auto";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.style.position = "fixed";
    video.style.inset = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.zIndex = "120";
    video.style.background = "#071421";
    shared = video;
  }
  return shared;
}

/** Append the shared video and call play() before yielding. The element stays put so a later move cannot pause it. */
export function playReelNow(src: string): Promise<void> {
  const video = reelVideoElement();
  if (!video) return Promise.resolve();
  video.style.display = "block";
  if (!video.isConnected) document.body.appendChild(video);
  return armReel(video, src);
}

export function hideReelVideo(): void {
  const video = reelVideoElement();
  if (!video) return;
  video.pause();
  video.style.display = "none";
}
