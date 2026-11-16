import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pressable, StyleSheet, TextInput, View, ViewStyle } from "react-native";
import { useFocusEffect } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { T } from "@/components/Text";
import { nightGlass } from "@/components/nightGlass";
import { useOverlayHistory } from "@/components/useOverlayHistory";
import type { Pillar } from "@/content/types";
import { islandStamp, prefersReducedMotion, pulse, readStamps } from "@/guide/stamps";
import { addStamp } from "@/guide/stamps";
import { localReelStore } from "@/reels/gate";
import { colors } from "@/theme";

const reward = "All five island stamps collected. Show your completed card to the TATEL team.";

export function StampCard({ pillars, onOpen }: { pillars: readonly Pillar[]; onOpen: (id: string) => void }) {
  const [tick, setTick] = useState(0);
  const [fresh, setFresh] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const reduced = prefersReducedMotion();
  useFocusEffect(useCallback(() => {
    setTick((value) => value + 1);
  }, []));
  const stamps = new Set(readStamps(localReelStore()));
  void tick;
  const held = pillars.filter((pillar) => stamps.has(islandStamp(pillar.id))).length;
  const done = held === pillars.length && pillars.length > 0;

  function accept(islandId: string) {
    const added = addStamp(localReelStore(), islandStamp(islandId));
    setTick((value) => value + 1);
    setFresh(islandId);
    if (added) pulse(reduced);
    setOpen(false);
  }

  return (
    <View style={styles.book}>
      <T variant="eyebrow" color={colors.gold}>Stamp card</T>
      <T variant="title" color={colors.foam}>Island passport</T>
      <T variant="small" color={colors.foam}>
        Five island stops, a collection of memories. Scan the code posted at each event stop or enter its short code below. Each stamp celebrates a place you've experienced in person. Your card is saved on this device, ready for your next island.
      </T>
      <T variant="rowTitle" color={colors.foam}>{held} of {pillars.length} island stamps</T>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${pillars.length ? Math.round((held / pillars.length) * 100) : 0}%` }]} />
      </View>
      <View style={styles.stamps}>
        {pillars.map((pillar) => {
          const heldStamp = stamps.has(islandStamp(pillar.id));
          const ink = fresh === pillar.id && !reduced;
          return (
            <Pressable
              key={pillar.id}
              accessibilityRole="button"
              accessibilityLabel={heldStamp ? `${pillar.name} stamped, ${pillar.island}` : `Scan ${pillar.name} on ${pillar.island}`}
              onPress={() => {
                if (heldStamp) onOpen(pillar.id);
                else setOpen(true);
              }}
              style={styles.slot}
            >
              <View style={[styles.stamp, heldStamp && styles.stampOn, ink && styles.stampIn]}>
                <StampArt id={pillar.id} inked={heldStamp} />
              </View>
              <T variant="small" color={colors.foam} numberOfLines={2} style={styles.name}>{pillar.name}</T>
              <T variant="meta" color={colors.gold} numberOfLines={2} style={styles.place}>{pillar.island}</T>
            </Pressable>
          );
        })}
      </View>
      {done ? (
        <View style={styles.reward}>
          <T variant="eyebrow" color={colors.ink}>Five islands. One great story.</T>
          <T variant="small" color={colors.ink}>{reward}</T>
        </View>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel="Scan an island code" onPress={() => setOpen(true)} style={styles.scan}>
          <T variant="button" color={colors.ink}>Scan an island code</T>
        </Pressable>
      )}
      {open ? <Scanner onClose={() => setOpen(false)} onStamp={accept} /> : null}
    </View>
  );
}

function StampArt({ id, inked }: { id: string; inked: boolean }) {
  const ink = inked ? "#1A1408" : "#FFE08A";
  return (
    <Svg width={54} height={54} viewBox="0 0 54 54">
      <Circle cx={27} cy={27} r={24} stroke={ink} strokeWidth={1.4} fill="none" />
      <Circle cx={27} cy={27} r={20} stroke={ink} strokeWidth={0.6} fill="none" strokeDasharray="2 2" />
      {id === "tech" ? <Path d="M16 30h22M20 22h6v12h-6zM28 18h8v16h-8z" stroke={ink} fill="none" /> : null}
      {id === "ai" ? <Path d="M27 16v6M27 32v6M16 27h6M32 27h6M20 20l4 4M30 30l4 4M34 20l-4 4M24 30l-4 4" stroke={ink} fill="none" /> : null}
      {id === "travel" ? <Path d="M14 32c6-2 10-8 13-14 3 6 7 12 13 14-4 2-8 2-13 0-5 2-9 2-13 0z" stroke={ink} fill="none" /> : null}
      {id === "entertainment" ? <Path d="M18 18h18v14H18zM22 36h10M24 22v6M30 22v6" stroke={ink} fill="none" /> : null}
      {id === "law" ? <Path d="M27 16v22M18 20h18M16 24l11-4 11 4M18 36h18" stroke={ink} fill="none" /> : null}
    </Svg>
  );
}

function Scanner({ onClose, onStamp }: { onClose: () => void; onStamp: (islandId: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stampRef = useRef(onStamp);
  stampRef.current = onStamp;
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("Point the camera at the code on the island.");
  const [live, setLive] = useState(false);
  useOverlayHistory(true, onClose);

  useEffect(() => {
    let stop = false;
    let stream: MediaStream | null = null;
    const video = videoRef.current;
    if (!video || !navigator.mediaDevices?.getUserMedia) {
      setMessage("This browser has no camera. Type the short code under the QR.");
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }).then(async (next) => {
      if (stop) {
        next.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = next;
      video.srcObject = next;
      video.muted = true;
      video.playsInline = true;
      await video.play().catch(() => undefined);
      setLive(true);
      const Detector = await detector();
      if (!Detector) {
        setMessage("Camera is on, but this phone cannot read a QR in the page. Type the short code.");
        return;
      }
      const reader = new Detector({ formats: ["qr_code"] });
      const tick = async () => {
        if (stop) return;
        try {
          const found = await reader.detect(video);
          const raw = found?.[0]?.rawValue;
          if (raw) {
            stop = true;
            const island = await verify(raw);
            if (island) stampRef.current(island);
            else setMessage("That code is not a TATEL island stamp.");
            return;
          }
        } catch {
          // keep trying
        }
        if (!stop) requestAnimationFrame(() => void tick());
      };
      void tick();
    }).catch(() => {
      setMessage("Camera is blocked. On iPhone, allow camera for TATEL, or type the short code.");
    });
    return () => {
      stop = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function submit() {
    const island = await verify(code);
    if (island) stampRef.current(island);
    else setMessage("That code does not match an island. Check the poster and try again.");
  }

  const sheet = (
    <View style={styles.modal}>
      <View style={styles.sheet}>
        <T variant="eyebrow" color={colors.gold}>Scan</T>
        <T variant="small" color={colors.foam}>{message}</T>
        <View style={styles.camera}>
          {typeof document !== "undefined" ? createElement("video", {
            ref: (node: HTMLVideoElement | null) => {
              videoRef.current = node;
            },
            muted: true,
            playsInline: true,
            autoPlay: true,
            style: { width: "100%", height: "100%", objectFit: "cover" },
          }) : null}
          {!live ? <T variant="meta" color={colors.gold}>Waiting for the camera</T> : null}
        </View>
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholder="Short code"
          placeholderTextColor="rgba(245,241,232,0.45)"
          style={styles.input}
          accessibilityLabel="Island short code"
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Check short code" onPress={() => void submit()} style={styles.scan}>
          <T variant="button" color={colors.ink}>Check code</T>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={onClose} style={styles.close}>
          <T variant="button" color={colors.gold}>Close</T>
        </Pressable>
      </View>
    </View>
  );
  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

async function detector(): Promise<{ new (opts?: { formats?: string[] }): { detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]> } } | null> {
  const native = (globalThis as { BarcodeDetector?: { new (opts?: { formats?: string[] }): { detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]> } } }).BarcodeDetector;
  if (native) return native;
  try {
    const mod = await import("barcode-detector");
    return mod.BarcodeDetector as { new (opts?: { formats?: string[] }): { detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]> } };
  } catch {
    return null;
  }
}

async function verify(code: string): Promise<string | null> {
  const response = await fetch("/api/stamps/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code.trim() }),
  });
  if (!response.ok) return null;
  const body = await response.json() as { ok?: boolean; islandId?: string };
  return body.ok && body.islandId ? body.islandId : null;
}

const styles = StyleSheet.create({
  book: { marginHorizontal: 16, marginBottom: 16, padding: 16, gap: 8, borderRadius: 28, borderWidth: 1, borderColor: "rgba(255,224,138,0.55)", backgroundColor: "#10283A" },
  track: { height: 6, borderRadius: 99, backgroundColor: "rgba(255,224,138,0.2)", overflow: "hidden" },
  trackFill: { height: 6, backgroundColor: colors.gold },
  stamps: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  slot: { width: "47%", minHeight: 150, alignItems: "center", gap: 4, padding: 8, borderRadius: 18, backgroundColor: "rgba(7,20,33,0.72)" },
  stamp: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(255,224,138,0.7)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7,27,42,0.4)",
  },
  stampOn: { backgroundColor: colors.gold, borderStyle: "solid", borderColor: "#F4E2A4", transform: [{ rotate: "-8deg" }] },
  stampIn: {
    ...({
      animationDuration: "520ms",
      animationTimingFunction: "ease-out",
      animationKeyframes: {
        from: { transform: "scale(1.35) rotate(-18deg)", opacity: 0.3 },
        to: { transform: "scale(1) rotate(-8deg)", opacity: 1 },
      },
    } as ViewStyle),
  },
  name: { textAlign: "center" },
  place: { textAlign: "center" },
  reward: { padding: 12, borderRadius: 16, backgroundColor: colors.gold, gap: 4 },
  scan: { minHeight: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  modal: { position: "fixed", top: 0, right: 0, bottom: 0, left: 0, zIndex: 120, justifyContent: "flex-end", backgroundColor: "rgba(6,14,24,0.72)" } as unknown as ViewStyle,
  sheet: { margin: 12, padding: 14, gap: 8, borderRadius: 22, backgroundColor: "#10283A", borderWidth: 1, borderColor: "rgba(255,224,138,0.45)" },
  camera: { height: 180, borderRadius: 16, overflow: "hidden", backgroundColor: "#071421", alignItems: "center", justifyContent: "center" },
  input: { minHeight: 48, borderRadius: 14, paddingHorizontal: 12, color: colors.foam, borderWidth: 1, borderColor: "rgba(255,224,138,0.45)", backgroundColor: "rgba(7,20,33,0.9)" },
  close: { minHeight: 44, alignItems: "center", justifyContent: "center" },
});
