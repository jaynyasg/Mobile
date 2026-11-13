import { Href, useRouter } from "expo-router";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { ReelPlayer, type ReelExit } from "@/components/ReelPlayer";
import { reels, type Reel, type ReelId } from "@/content/reels";
import { markGuide } from "@/guide/path";
import { webTrackStore } from "@/guide/interests";
import { addStamp, islandStamp, pulse, prefersReducedMotion, reelStamp } from "@/guide/stamps";
import {
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
import { playReelNow, reelPlaybackSrc } from "./playback";

interface PendingReel {
  id: ReelId;
  mode: "video" | "poster";
  href?: Href;
  src: string;
  nonce: number;
  /** play() started inside the tap, when there was one. */
  play?: Promise<void>;
}

interface ReelApi {
  openChapter: (id: ReelId, href: Href) => void;
  replayIntro: () => void;
  markZone: (zoneId: string) => void;
  zoneExplored: (zoneId: string) => boolean;
  exploredVersion: number;
  guideTick: number;
  reelActive: boolean;
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
  const [guideTick, setGuideTick] = useState(0);
  const pendingRef = useRef(pending);
  const nonce = useRef(0);
  pendingRef.current = pending;

  useEffect(() => {
    const mode = playbackMode(false);
    if (mode === "skip") return;
    const src = reelPlaybackSrc("intro");
    const play = mode === "video" ? playReelNow(src) : undefined;
    nonce.current += 1;
    setPending({ id: "intro", mode, src, play, nonce: nonce.current });
  }, []);

  const bumpZone = useCallback((zoneId: string | undefined) => {
    if (!zoneId) return;
    markExplored(localReelStore(), zoneId);
    if (addStamp(localReelStore(), islandStamp(zoneId))) pulse(prefersReducedMotion());
    setExploredVersion((version) => version + 1);
  }, []);

  const replayIntro = useCallback(() => {
    const mode = playbackMode(true) === "poster" ? "poster" : "video";
    const src = reelPlaybackSrc("intro");
    const play = mode === "video" ? playReelNow(src) : undefined;
    nonce.current += 1;
    setPending({ id: "intro", mode, src, play, nonce: nonce.current });
  }, []);

  const markZone = useCallback((zoneId: string) => {
    bumpZone(zoneId);
  }, [bumpZone]);

  const openChapter = useCallback((id: ReelId, href: Href) => {
    const mode = playbackMode(true) === "poster" ? "poster" : "video";
    const src = reelPlaybackSrc(id);
    const play = mode === "video" ? playReelNow(src) : undefined;
    nonce.current += 1;
    setPending({ id, mode, href, src, play, nonce: nonce.current });
  }, []);

  const zoneExplored = useCallback((zoneId: string) => isExplored(localReelStore(), zoneId), []);

  function complete(reason: ReelExit) {
    const current = pendingRef.current;
    if (!current) return;
    const reel = reels[current.id] as Reel;
    if (addStamp(localReelStore(), reelStamp(reel.id))) pulse(prefersReducedMotion());
    if (reel.kind === "intro") {
      markIntroPlayed(localReelStore());
      markGuide(webTrackStore(), "welcome");
      setGuideTick((tick) => tick + 1);
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
    guideTick,
    reelActive: pending !== null,
  }), [openChapter, replayIntro, markZone, zoneExplored, exploredVersion, guideTick, pending]);

  return (
    <ReelContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {pending ? (
          <ReelPlayer
            key={`${pending.id}:${pending.src}:${pending.nonce}`}
            reel={reels[pending.id]}
            mode={pending.mode}
            src={pending.src}
            play={pending.play}
            onDone={complete}
          />
        ) : null}
      </View>
    </ReelContext.Provider>
  );
}

export function useReels(): ReelApi {
  const value = useContext(ReelContext);
  if (!value) throw new Error("useReels must be used within ReelHost");
  return value;
}
