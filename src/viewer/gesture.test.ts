import { describe, expect, it } from "vitest";
import {
  beginPointers,
  clampTransform,
  DOUBLE_TAP_SCALE,
  endPointers,
  identityGesture,
  isDoubleTap,
  movePointers,
  toggleDoubleTap,
  zoomAt,
  type Edges,
  type Point,
  type Size,
} from "./gesture";

const origin: Point = { x: 200, y: 400 };
const frame: Size = { width: 300, height: 400 };
const open: Edges = { prev: true, next: true };

function screenX(content: number, scale: number, translate: number): number {
  return origin.x + content * scale + translate;
}

describe("viewer gestures", () => {
  it("keeps the pinched point under the fingers", () => {
    const point = { x: 120, y: 400 };
    const start = { scale: 1, x: 0, y: 0 };
    const content = (point.x - origin.x - start.x) / start.scale;
    const next = zoomAt(start, point, DOUBLE_TAP_SCALE, origin);
    expect(screenX(content, next.scale, next.x)).toBeCloseTo(point.x);
    expect(next.scale).toBe(DOUBLE_TAP_SCALE);
  });

  it("toggles double-tap between fit and a zoom anchored at the tap", () => {
    const zoomed = toggleDoubleTap({ scale: 1, x: 0, y: 0 }, { x: 100, y: 400 }, origin, frame);
    expect(zoomed.scale).toBe(DOUBLE_TAP_SCALE);
    expect(zoomed.x).not.toBe(0);
    expect(toggleDoubleTap(zoomed, { x: 100, y: 400 }, origin, frame)).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it("zooms from the center when a pinch stays centered", () => {
    let gesture = identityGesture(origin);
    gesture = beginPointers(gesture, [{ x: 150, y: 400 }, { x: 250, y: 400 }], origin);
    gesture = movePointers(gesture, [{ x: 100, y: 400 }, { x: 300, y: 400 }], frame, open);
    expect(gesture.transform.scale).toBeCloseTo(2);
    expect(gesture.transform.x).toBeCloseTo(0);
    expect(gesture.transform.y).toBeCloseTo(0);
    expect(gesture.mode).toBe("pinch");
  });

  it("follows a moving pinch midpoint", () => {
    let gesture = identityGesture(origin);
    gesture = beginPointers(gesture, [{ x: 180, y: 400 }, { x: 220, y: 400 }], origin);
    gesture = movePointers(gesture, [{ x: 140, y: 400 }, { x: 220, y: 400 }], frame, open);
    expect(gesture.transform.scale).toBeCloseTo(2);
    expect(gesture.transform.x).toBeCloseTo(-20);
  });

  it("clamps a pan so the photo cannot slide into empty space", () => {
    const clamped = clampTransform({ scale: 2, x: 800, y: -800 }, frame);
    expect(clamped.x).toBe(150);
    expect(clamped.y).toBe(-200);
    expect(clampTransform({ scale: 1, x: 40, y: 10 }, frame)).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it("steps to the next photo on a horizontal swipe and closes on a downward swipe", () => {
    let gesture = beginPointers(identityGesture(origin), [{ x: 220, y: 300 }], origin);
    gesture = movePointers(gesture, [{ x: 80, y: 308 }], frame, open);
    expect(endPointers(gesture, [], frame, open).effect).toEqual({ type: "step", delta: 1 });

    gesture = beginPointers(identityGesture(origin), [{ x: 80, y: 300 }], origin);
    gesture = movePointers(gesture, [{ x: 220, y: 312 }], frame, open);
    expect(endPointers(gesture, [], frame, open).effect).toEqual({ type: "step", delta: -1 });

    gesture = beginPointers(identityGesture(origin), [{ x: 200, y: 200 }], origin);
    gesture = movePointers(gesture, [{ x: 210, y: 360 }], frame, open);
    const dismissed = endPointers(gesture, [], frame, open);
    expect(dismissed.effect).toEqual({ type: "close" });
    expect(dismissed.gesture.transform).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it("does not close on an upward swipe or move past a missing neighbor", () => {
    let gesture = beginPointers(identityGesture(origin), [{ x: 200, y: 360 }], origin);
    gesture = movePointers(gesture, [{ x: 206, y: 180 }], frame, open);
    const upward = endPointers(gesture, [], frame, open);
    expect(upward.effect).toEqual({ type: "none" });
    expect(upward.gesture.transform).toEqual({ scale: 1, x: 0, y: 0 });

    gesture = beginPointers(identityGesture(origin), [{ x: 220, y: 300 }], origin);
    gesture = movePointers(gesture, [{ x: 20, y: 300 }], frame, { prev: true, next: false });
    expect(endPointers(gesture, [], frame, { prev: true, next: false }).effect).toEqual({ type: "none" });
    expect(gesture.transform.x).toBeGreaterThan(-220);
  });

  it("treats a small movement as a tap and a second tap as a double tap", () => {
    let gesture = beginPointers(identityGesture(origin), [{ x: 40, y: 50 }], origin);
    gesture = movePointers(gesture, [{ x: 46, y: 54 }], frame, open);
    expect(endPointers(gesture, [], frame, open).effect).toEqual({ type: "tap", point: { x: 40, y: 50 } });
    const first = { at: 1_000, point: { x: 40, y: 50 } };
    expect(isDoubleTap(first, { x: 48, y: 58 }, 1_200)).toBe(true);
    expect(isDoubleTap(first, { x: 90, y: 50 }, 1_200)).toBe(false);
    expect(isDoubleTap(first, { x: 42, y: 52 }, 1_400)).toBe(false);
    expect(isDoubleTap(null, { x: 42, y: 52 }, 1_200)).toBe(false);
  });
});
