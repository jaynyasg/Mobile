import { useRef, useState } from "react";
import { Image, Modal, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ViewerPhoto } from "@/viewer/photos";
import { beginPointers, endPointers, identityGesture, isDoubleTap, movePointers, toggleDoubleTap, type Gesture, type Point } from "@/viewer/gesture";
import { T } from "./Text";
import { colors } from "@/theme";

export function ImageViewerOverlay({
  photos,
  initialIndex,
  onClose,
}: {
  photos: ViewerPhoto[];
  initialIndex: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const gestureRef = useRef<Gesture>(identityGesture());
  const lastTapRef = useRef<{ at: number; point: Point } | null>(null);
  const indexRef = useRef(index);
  const photosRef = useRef(photos);
  indexRef.current = index;
  photosRef.current = photos;
  const photo = photos[index] ?? photos[0];
  const many = photos.length > 1;
  const origin = { x: 0, y: 0 };
  const box = { width: 320, height: 480 };

  function publish(gesture: Gesture) {
    gestureRef.current = gesture;
    setTransform(gesture.transform);
  }

  function go(delta: number) {
    setIndex((current) => Math.min(photos.length - 1, Math.max(0, current + delta)));
    publish(identityGesture());
    lastTapRef.current = null;
  }

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const point = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
        publish(beginPointers(gestureRef.current, [point], origin));
      },
      onPanResponderMove: (event) => {
        const point = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
        publish(movePointers(gestureRef.current, [point], box, { prev: indexRef.current > 0, next: indexRef.current < photosRef.current.length - 1 }));
      },
      onPanResponderRelease: (event) => {
        const edges = { prev: indexRef.current > 0, next: indexRef.current < photosRef.current.length - 1 };
        const result = endPointers(gestureRef.current, [], box, edges);
        if (result.effect.type === "close") {
          onClose();
          return;
        }
        if (result.effect.type === "step") {
          const delta = result.effect.delta;
          publish(result.gesture);
          setIndex((current) => Math.min(photosRef.current.length - 1, Math.max(0, current + delta)));
          return;
        }
        if (result.effect.type === "tap") {
          const now = Date.now();
          const point = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
          if (isDoubleTap(lastTapRef.current, point, now)) {
            lastTapRef.current = null;
            const next = toggleDoubleTap(result.gesture.transform, point, origin, box);
            publish({ ...identityGesture(), transform: next });
            return;
          }
          lastTapRef.current = { at: now, point };
        }
        publish(result.gesture);
      },
    }),
  ).current;

  if (!photo) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close photo" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.stage} {...responder.panHandlers}>
          <Image
            source={{ uri: photo.uri }}
            style={[styles.image, { transform: [{ translateX: transform.x }, { translateY: transform.y }, { scale: transform.scale }] }]}
            resizeMode="contain"
            accessibilityLabel={photo.alt}
            accessibilityIgnoresInvertColors
          />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[styles.close, { top: insets.top + 10, right: insets.right + 10 }]}>
          <T variant="button" color={colors.ivory}>×</T>
        </Pressable>
        {many ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Previous photo" disabled={index === 0} onPress={() => go(-1)} style={[styles.arrow, { left: insets.left + 8, opacity: index === 0 ? 0.35 : 1 }]}>
            <T variant="button" color={colors.ivory}>‹</T>
          </Pressable>
        ) : null}
        {many ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Next photo" disabled={index === photos.length - 1} onPress={() => go(1)} style={[styles.arrow, { right: insets.right + 8, opacity: index === photos.length - 1 ? 0.35 : 1 }]}>
            <T variant="button" color={colors.ivory}>›</T>
          </Pressable>
        ) : null}
        {many ? <T variant="meta" color={colors.gold} style={[styles.count, { bottom: insets.bottom + 18 }]}>{index + 1} / {photos.length}</T> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(7,20,33,0.92)" },
  stage: { flex: 1, marginTop: 64, marginBottom: 64, marginHorizontal: 16, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  close: { position: "absolute", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(10,18,32,0.72)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.42)" },
  arrow: { position: "absolute", top: "46%", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(10,18,32,0.72)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.42)" },
  count: { position: "absolute", left: 0, right: 0, textAlign: "center" },
});
