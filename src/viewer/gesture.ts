export const MIN_SCALE = 1;
export const MAX_SCALE = 4;
export const DOUBLE_TAP_SCALE = 2.5;
export const TAP_SLOP = 12;
export const SWIPE_DISTANCE = 64;
export const DISMISS_DISTANCE = 96;
export const DOUBLE_TAP_MS = 280;

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  scale: number;
  x: number;
  y: number;
}

export interface Edges {
  prev: boolean;
  next: boolean;
}

export type GestureMode = "idle" | "pending" | "pan" | "pinch" | "swipe";

export interface Gesture {
  transform: Transform;
  mode: GestureMode;
  origin: Point;
  startTransform: Transform;
  startPoints: Point[];
  startDistance: number;
  startMid: Point;
  moved: boolean;
}

export type GestureEffect =
  | { type: "none" }
  | { type: "close" }
  | { type: "step"; delta: -1 | 1 }
  | { type: "tap"; point: Point };

const identity: Transform = { scale: 1, x: 0, y: 0 };

export function identityGesture(origin: Point = { x: 0, y: 0 }): Gesture {
  return {
    transform: { ...identity },
    mode: "idle",
    origin,
    startTransform: { ...identity },
    startPoints: [],
    startDistance: 0,
    startMid: { x: 0, y: 0 },
    moved: false,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function copyTransform(transform: Transform): Transform {
  return { scale: transform.scale, x: transform.x, y: transform.y };
}

export function clampTransform(transform: Transform, frame: Size): Transform {
  const scale = clamp(transform.scale, MIN_SCALE, MAX_SCALE);
  if (scale <= 1) return { ...identity };
  const limitX = Math.max(0, (frame.width * (scale - 1)) / 2);
  const limitY = Math.max(0, (frame.height * (scale - 1)) / 2);
  return {
    scale,
    x: clamp(transform.x, -limitX, limitX),
    y: clamp(transform.y, -limitY, limitY),
  };
}

export function zoomAt(transform: Transform, point: Point, nextScale: number, origin: Point): Transform {
  const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  const ratio = scale / transform.scale;
  return {
    scale,
    x: (point.x - origin.x) * (1 - ratio) + transform.x * ratio,
    y: (point.y - origin.y) * (1 - ratio) + transform.y * ratio,
  };
}

export function toggleDoubleTap(transform: Transform, point: Point, origin: Point, frame: Size): Transform {
  if (transform.scale > 1.05) return { ...identity };
  return clampTransform(zoomAt(transform, point, DOUBLE_TAP_SCALE, origin), frame);
}

export function pinchTransform(
  start: Transform,
  origin: Point,
  startMid: Point,
  currentMid: Point,
  startDistance: number,
  currentDistance: number,
): Transform {
  const nextScale = clamp(start.scale * (currentDistance / Math.max(startDistance, 1)), MIN_SCALE, MAX_SCALE);
  const cx = (startMid.x - origin.x - start.x) / start.scale;
  const cy = (startMid.y - origin.y - start.y) / start.scale;
  return {
    scale: nextScale,
    x: currentMid.x - origin.x - cx * nextScale,
    y: currentMid.y - origin.y - cy * nextScale,
  };
}

export function isDoubleTap(previous: { at: number; point: Point } | null, point: Point, now: number): boolean {
  if (!previous) return false;
  return now - previous.at >= 0 && now - previous.at <= DOUBLE_TAP_MS && distance(previous.point, point) <= 28;
}

function startPinch(gesture: Gesture, points: Point[]): Gesture {
  const [a, b] = points;
  return {
    ...gesture,
    mode: "pinch",
    startTransform: copyTransform(gesture.transform),
    startPoints: [a, b],
    startDistance: Math.max(distance(a, b), 1),
    startMid: midpoint(a, b),
    moved: true,
  };
}

function rest(gesture: Gesture, transform: Transform = gesture.transform): Gesture {
  return {
    ...gesture,
    transform,
    mode: "idle",
    startPoints: [],
    moved: false,
  };
}

export function beginPointers(gesture: Gesture, points: Point[], origin: Point): Gesture {
  if (points.length >= 2) return startPinch({ ...gesture, origin }, points);
  if (points.length === 1) {
    return {
      ...gesture,
      origin,
      mode: "pending",
      startTransform: copyTransform(gesture.transform),
      startPoints: [points[0]],
      moved: false,
    };
  }
  return { ...gesture, origin };
}

export function movePointers(gesture: Gesture, points: Point[], frame: Size, edges: Edges): Gesture {
  if (points.length >= 2) {
    const base = gesture.mode === "pinch" ? gesture : startPinch(gesture, points);
    const [a, b] = points;
    const raw = pinchTransform(base.startTransform, base.origin, base.startMid, midpoint(a, b), base.startDistance, distance(a, b));
    return { ...base, transform: clampTransform(raw, frame), moved: true };
  }
  if (points.length !== 1 || gesture.startPoints.length === 0) return gesture;
  let current = gesture;
  if (current.mode === "pinch") {
    current = {
      ...current,
      mode: current.transform.scale > 1.01 ? "pan" : "swipe",
      startTransform: copyTransform(current.transform),
      startPoints: [points[0]],
    };
  }
  const delta = {
    x: points[0].x - current.startPoints[0].x,
    y: points[0].y - current.startPoints[0].y,
  };
  if (!current.moved && Math.hypot(delta.x, delta.y) < TAP_SLOP) return current;
  if (current.mode === "pan" || current.startTransform.scale > 1.01) {
    return {
      ...current,
      mode: "pan",
      moved: true,
      transform: clampTransform(
        {
          scale: current.startTransform.scale,
          x: current.startTransform.x + delta.x,
          y: current.startTransform.y + delta.y,
        },
        frame,
      ),
    };
  }
  let x = delta.x;
  const y = delta.y;
  if (x > 0 && !edges.prev) x *= 0.35;
  if (x < 0 && !edges.next) x *= 0.35;
  return { ...current, mode: "swipe", moved: true, transform: { scale: 1, x, y } };
}

export function endPointers(gesture: Gesture, points: Point[], frame: Size, edges: Edges): { gesture: Gesture; effect: GestureEffect } {
  if (points.length >= 2) {
    const next = movePointers(gesture, points, frame, edges);
    return { gesture: next, effect: { type: "none" } };
  }
  if (points.length === 1) {
    const scale = gesture.transform.scale;
    return {
      gesture: {
        ...gesture,
        mode: scale > 1.01 ? "pan" : "swipe",
        startTransform: copyTransform(gesture.transform),
        startPoints: [points[0]],
        moved: true,
      },
      effect: { type: "none" },
    };
  }
  if (!gesture.moved || gesture.mode === "pending") {
    const point = gesture.startPoints[0];
    if (!point) return { gesture: rest(gesture), effect: { type: "none" } };
    return { gesture: rest(gesture, gesture.transform), effect: { type: "tap", point } };
  }
  if (gesture.mode === "swipe") {
    const { x, y } = gesture.transform;
    const dismiss = y > DISMISS_DISTANCE && y > Math.abs(x);
    const horizontal = Math.abs(x) > SWIPE_DISTANCE && Math.abs(x) > Math.abs(y);
    if (dismiss) return { gesture: rest(gesture, identity), effect: { type: "close" } };
    if (horizontal) {
      const delta: -1 | 1 = x < 0 ? 1 : -1;
      const allowed = delta === 1 ? edges.next : edges.prev;
      if (allowed) return { gesture: rest(gesture, identity), effect: { type: "step", delta } };
    }
    return { gesture: rest(gesture, identity), effect: { type: "none" } };
  }
  const snapped = gesture.transform.scale < 1.05 ? { ...identity } : clampTransform(gesture.transform, frame);
  return { gesture: rest(gesture, snapped), effect: { type: "none" } };
}
