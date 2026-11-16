import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { webStorage } from "@/welcome";
import { INTAKE_KEY, readIntake } from "./intake";

/** Keep mounted pages in sync when guests change their opening answers. */
export function useIntake() {
  const [intake, setIntake] = useState(() => readIntake(webStorage()));
  const refresh = useCallback(() => {
    const next = readIntake(webStorage());
    setIntake((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
  }, []);
  useFocusEffect(refresh);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => { if (event.key === INTAKE_KEY || event.key === null) refresh(); };
    window.addEventListener("tatel-intake-changed", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("tatel-intake-changed", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);
  return intake;
}
