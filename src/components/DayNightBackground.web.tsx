import { createElement, useEffect, useState } from "react";
import { View } from "react-native";
import { scenePhotos } from "@/theme";

const fill = { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 };

function staggerSeconds(key: string): number {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) hash = (hash * 33 + key.charCodeAt(index)) >>> 0;
  return (hash % 220) / 10;
}

function prefersStill(): boolean {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

export function DayNightBackground({
  day = scenePhotos.day,
  night,
  phase,
}: {
  day?: string | null;
  night?: string | null;
  phase?: string;
}) {
  const dayUri = day || scenePhotos.day;
  const nightUri = night || dayUri;
  const [still, setStill] = useState(prefersStill);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const onChange = () => setStill(media.matches);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (still || nightUri === dayUri) return;
    const image = new Image();
    image.src = nightUri;
  }, [dayUri, nightUri, still]);

  const delay = `-${staggerSeconds(phase || dayUri)}s`;

  return (
    <View pointerEvents="none" style={fill}>
      {createElement("img", {
        src: nightUri,
        alt: "",
        style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
      })}
      {createElement("img", {
        src: dayUri,
        alt: "",
        className: still ? undefined : "tatel-day",
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          animationDelay: still ? undefined : delay,
        },
      })}
      {createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(6,14,24,0.1) 0%, rgba(6,14,24,0.02) 40%, rgba(6,14,24,0.28) 100%)",
        },
      })}
    </View>
  );
}
