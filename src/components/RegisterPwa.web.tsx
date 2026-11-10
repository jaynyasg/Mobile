import { useEffect } from "react";

export function RegisterPwa() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || __DEV__) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
