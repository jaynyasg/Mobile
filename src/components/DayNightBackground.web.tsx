import { useIsFocused } from "expo-router";
import { createElement, useEffect, useState } from "react";
import { View } from "react-native";
import { scenePhotos } from "@/theme";
import { homeMedia } from "./homeMedia";

const fill = { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 };
type Mode = "video" | "crossfade" | "still";

function staggerSeconds(key: string): number {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) hash = (hash * 33 + key.charCodeAt(index)) >>> 0;
  return (hash % 580) / 10;
}

function mediaMode(): Mode {
  if (typeof window === "undefined") return "still";
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "still";
  const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  if (saveData) return "crossfade";
  return "video";
}

export function DayNightBackground({
  day = scenePhotos.day,
  night,
  phase,
  video = homeMedia.mp4,
  videoWebm = homeMedia.webm,
  poster = homeMedia.poster,
}: {
  day?: string | null;
  night?: string | null;
  phase?: string;
  video?: string | null;
  videoWebm?: string | null;
  poster?: string | null;
}) {
  const focused = useIsFocused();
  const dayUri = day || scenePhotos.day;
  const nightUri = night || dayUri;
  const posterUri = poster || dayUri;
  const [mode, setMode] = useState<Mode>(mediaMode);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const apply = () => setMode(mediaMode());
    media?.addEventListener?.("change", apply);
    return () => media?.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    if (mode === "still" || nightUri === dayUri) return;
    const image = new Image();
    image.src = nightUri;
  }, [dayUri, nightUri, mode]);

  const playVideo = mode === "video" && focused && Boolean(video);
  const delay = `-${staggerSeconds(phase || dayUri)}s`;

  return (
    <View pointerEvents="none" style={fill}>
      {createElement("img", {
        src: mode === "still" ? dayUri : posterUri,
        alt: "",
        style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
      })}
      {mode === "crossfade"
        ? createElement("img", {
            src: dayUri,
            alt: "",
            className: "tatel-day",
            style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", animationDelay: delay },
          })
        : null}
      {playVideo
        ? createElement(
            "video",
            {
              autoPlay: true,
              muted: true,
              loop: true,
              playsInline: true,
              poster: posterUri,
              onError: () => setMode("crossfade"),
              ref: (node: HTMLVideoElement | null) => {
                if (!node) return;
                node.muted = true;
                const start = () => {
                  const offset = staggerSeconds(phase || dayUri);
                  if (Number.isFinite(node.duration) && node.currentTime < 0.2) node.currentTime = offset % node.duration;
                  const attempt = node.play();
                  if (attempt) attempt.catch(() => setMode("crossfade"));
                };
                if (node.readyState >= 1) start();
                else node.addEventListener("loadedmetadata", start, { once: true });
              },
              style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
            },
            videoWebm ? createElement("source", { src: videoWebm, type: "video/webm" }) : null,
            createElement("source", { src: video, type: "video/mp4" }),
          )
        : null}
      {createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(6,14,24,0.28) 0%, rgba(6,14,24,0.14) 36%, rgba(6,14,24,0.4) 72%, rgba(6,14,24,0.72) 100%)",
        },
      })}
    </View>
  );
}
