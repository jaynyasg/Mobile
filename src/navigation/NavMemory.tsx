import { usePathname } from "expo-router";
import { useEffect } from "react";
import { notePath } from "./appHistory";

/** Remember each screen so the in-app back button can return to it. */
export function NavMemory() {
  const path = usePathname();
  useEffect(() => {
    const search = typeof window === "undefined" ? "" : window.location.search;
    notePath(`${path}${search}`);
  }, [path]);
  return null;
}
