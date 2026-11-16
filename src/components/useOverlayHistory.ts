import { useEffect, useRef } from "react";
import { registerOverlay } from "@/navigation/appHistory";

/** So the in-app back button, and the browser back button, close a modal first. */
export function useOverlayHistory(active: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    const history = window.history;
    const base = history.state && typeof history.state === "object" ? history.state as Record<string, unknown> : {};
    history.pushState({ ...base, tatelOverlay: true }, "");
    let armed = true;
    const finish = () => {
      if (!armed) return;
      armed = false;
      closeRef.current();
    };
    const onPop = () => finish();
    window.addEventListener("popstate", onPop);
    const unregister = registerOverlay(() => {
      if (!armed) return;
      const state = history.state as { tatelOverlay?: boolean } | null;
      if (state?.tatelOverlay) history.back();
      else finish();
    });
    return () => {
      window.removeEventListener("popstate", onPop);
      unregister();
      if (!armed) return;
      armed = false;
      const state = history.state as { tatelOverlay?: boolean } | null;
      if (state?.tatelOverlay) history.back();
    };
  }, [active]);
}
