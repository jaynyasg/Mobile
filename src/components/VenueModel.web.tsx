import { createElement, useEffect, useState } from "react";
import { T } from "./Text";

export function VenueModel({ src, label }: { src: string; label: string }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer")
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <T variant="meta">The 3D viewer could not load.</T>;
  if (!ready) return <T variant="meta">Loading the 3D viewer…</T>;
  return createElement("model-viewer", {
    src,
    alt: label,
    "camera-controls": true,
    "auto-rotate": true,
    style: { width: "100%", height: "320px", backgroundColor: "#071B2A" },
  });
}
