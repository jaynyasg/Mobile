import { Href, useRouter } from "expo-router";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { ReelPlayer, type ReelExit } from "@/components/ReelPlayer";
import { reels, type Reel, type ReelId } from "@/content/reels";
import {
  hasSeenChapter,
  introPlayback,
  isExplored,
  localReelStore,
  markChapterSeen,
  markExplored,
  markIntroPlayed,
  readConnection,
  sessionReelStore,
  type ReelStore,
} from "./gate";

interface PendingReel {
  id: ReelId;
  mode: "video" | "poster";
  href?: Href;
}

interface ReelApi {
  openChapter: (id: ReelId, href: Href) => void;
  replayIntro: () => void;
  markZone: (zoneId: string) => void;
  zoneExplored: (zoneId: string) => boolean;
  exploredVersion: number;
}

const ReelContext = createContext<ReelApi | null>(null);

const sessionMemory = new Map<string, string>();
const memorySession: ReelStore = {
  getItem: (key) => sessionMemory.get(key) ?? null,
  setItem: (key, value) => {
    sessionMemory.set(key, value);
  },
};

function chapterStore(): ReelStore | null {
  return sessionReelStore() ?? memorySession;
}

function playbackMode(ignoreDay = false): "video" | "poster" | "skip" {
  if (Platform.OS !== "web") return ignoreDay ? "poster" : introPlayback(localReelStore(), readConnection()) === "skip" ? "skip" : "poster";
  if (ignoreDay) {
    const connection = readConnection();
    if (connection.reducedMotion || connection.saveData || connection.slow) return "poster";
    return "video";
  }
  return introPlayback(localReelStore(), readConnection());
}

export function ReelHost({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingReel | null>(null);
  const [exploredVersion, setExploredVersion] = useState(0);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  useEffect(() => {
    const mode = playbackMode(false);
    if (mode === "skip") return;
    setPending({ id: "intro", mode });
  }, []);

  const bumpZone = useCallback((zoneId: string | undefined) => {
    if (!zoneId) return;
    markExplored(localReelStore(), zoneId);
    setExploredVersion((version) => version + 1);
  }, []);

  const replayIntro = useCallback(() => {
    const mode = playbackMode(true);
    setPending({ id: "intro", mode: mode === "skip" ? "poster" : mode });
  }, []);

  const markZone = useCallback((zoneId: string) => {
    bumpZone(zoneId);
  }, [bumpZone]);

  const openChapter = useCallback((id: ReelId, href: Href) => {
    const reel = reels[id] as Reel;
    if (hasSeenChapter(chapterStore(), id)) {
      bumpZone(reel.zoneId);
      router.navigate(href);
      return;
    }
    const mode = playbackMode(true);
    setPending({ id, mode: mode === "skip" ? "video" : mode, href });
  }, [bumpZone, router]);

  const zoneExplored = useCallback((zoneId: string) => isExplored(localReelStore(), zoneId), []);

  function complete(reason: ReelExit) {
    const current = pendingRef.current;
    if (!current) return;
    const reel = reels[current.id] as Reel;
    if (reel.kind === "intro") {
      markIntroPlayed(localReelStore());
    } else {
      markChapterSeen(chapterStore(), reel.id);
      bumpZone(reel.zoneId);
      if (current.href) router.navigate(current.href);
    }
    void reason;
    setPending(null);
  }

  const value = useMemo<ReelApi>(() => ({
    openChapter,
    replayIntro,
    markZone,
    zoneExplored,
    exploredVersion,
  }), [openChapter, replayIntro, markZone, zoneExplored, exploredVersion]);

  return (
    <ReelContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {pending ? <ReelPlayer reel={reels[pending.id]} mode={pending.mode} onDone={complete} /> : null}
      </View>
    </ReelContext.Provider>
  );
}

export function useReels(): ReelApi {
  const value = useContext(ReelContext);
  if (!value) throw new Error("useReels must be used within ReelHost");
  return value;
}
