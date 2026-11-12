import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { setProgram } from "./active";
import { bundle } from "./bundle";
import { CONTENT_CACHE_KEY, ContentSource, resolveContent } from "./load";
import { programRequestUrls } from "./published";
import type { ProgramData } from "./types";

interface ContentValue {
  program: ProgramData;
  source: ContentSource;
}

const ContentContext = createContext<ContentValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<ContentValue>({ program: bundle, source: "bundle" });

  useEffect(() => {
    let cancelled = false;
    const urls = programRequestUrls({
      override: process.env.EXPO_PUBLIC_CONTENT_URL,
      origin: typeof window !== "undefined" && window.location?.origin ? window.location.origin : null,
    });
    resolveContent({
      bundle,
      url: urls.url,
      fallbackUrl: urls.fallbackUrl,
      readCache: async () => {
        const raw = await AsyncStorage.getItem(CONTENT_CACHE_KEY);
        return raw ? (JSON.parse(raw) as unknown) : null;
      },
      writeCache: async (program) => {
        await AsyncStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(program));
      },
    })
      .then((result) => {
        if (cancelled) return;
        setProgram(result.program);
        setValue(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const stable = useMemo(() => value, [value]);
  return <ContentContext.Provider value={stable}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentValue {
  const value = useContext(ContentContext);
  if (!value) throw new Error("useContent must be used inside ContentProvider");
  return value;
}
