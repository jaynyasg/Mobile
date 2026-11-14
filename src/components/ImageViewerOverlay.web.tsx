import { createElement, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { ViewerPhoto } from "@/viewer/photos";
import {
  beginPointers,
  endPointers,
  identityGesture,
  isDoubleTap,
  movePointers,
  toggleDoubleTap,
  type Gesture,
  type Point,
  type Size,
} from "@/viewer/gesture";
import { lockScroll } from "@/viewer/scroll";

const GOLD = "#FFE08A";
const IVORY = "#F7F4EF";

export function ImageViewerOverlay({
  photos,
  initialIndex,
  onClose,
}: {
  photos: ViewerPhoto[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [frame, setFrame] = useState({ x: 0, y: 0, scale: 1, dragging: false });
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const gestureRef = useRef<Gesture>(identityGesture());
  const indexRef = useRef(index);
  const photosRef = useRef(photos);
  const onCloseRef = useRef(onClose);
  const lastTapRef = useRef<{ at: number; point: Point } | null>(null);
  const touchInputRef = useRef(false);
  const suppressClickRef = useRef(false);
  const goRef = useRef<(delta: number) => void>(() => undefined);
  indexRef.current = index;
  photosRef.current = photos;
  onCloseRef.current = onClose;
  const photo = photos[index] ?? photos[0];
  const many = photos.length > 1;

  function metrics(): { origin: Point; frame: Size } {
    const stage = stageRef.current?.getBoundingClientRect();
    const origin = stage
      ? { x: stage.left + stage.width / 2, y: stage.top + stage.height / 2 }
      : { x: 0, y: 0 };
    const image = imageRef.current;
    if (stage && image && image.naturalWidth > 0 && image.naturalHeight > 0) {
      const fit = Math.min(stage.width / image.naturalWidth, stage.height / image.naturalHeight);
      return { origin, frame: { width: image.naturalWidth * fit, height: image.naturalHeight * fit } };
    }
    return { origin, frame: { width: stage?.width ?? 1, height: stage?.height ?? 1 } };
  }

  function edges() {
    return { prev: indexRef.current > 0, next: indexRef.current < photosRef.current.length - 1 };
  }

  function publish(gesture: Gesture, dragging: boolean) {
    gestureRef.current = gesture;
    setFrame({ x: gesture.transform.x, y: gesture.transform.y, scale: gesture.transform.scale, dragging });
  }

  goRef.current = (delta: number) => {
    setIndex((current) => Math.min(photosRef.current.length - 1, Math.max(0, current + delta)));
    publish(identityGesture(gestureRef.current.origin), false);
    lastTapRef.current = null;
  };

  useEffect(() => {
    const node = dialogRef.current;
    if (!node || typeof document === "undefined") return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById("root");
    const previousInert = root?.inert ?? false;
    const previousHidden = root?.getAttribute("aria-hidden") ?? null;
    if (root) {
      root.inert = true;
      root.setAttribute("aria-hidden", "true");
    }
    const unlock = lockScroll({
      scrollY: window.scrollY,
      documentElement: document.documentElement,
      body: document.body,
      scrollTo: (x, y) => window.scrollTo(x, y),
    });
    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus());

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goRef.current(1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goRef.current(-1);
        return;
      }
      if (event.key !== "Tab") return;
      const items = [...node.querySelectorAll<HTMLElement>("button:not(:disabled)")];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const applyMove = (points: Point[]) => {
      const { origin, frame: box } = metrics();
      gestureRef.current.origin = origin;
      publish(movePointers(gestureRef.current, points, box, edges()), true);
    };

    const finish = (points: Point[], native?: TouchEvent) => {
      const { origin, frame: box } = metrics();
      const moved = gestureRef.current.moved;
      const result = endPointers({ ...gestureRef.current, origin }, points, box, edges());
      const target = native?.target instanceof Element ? native.target : null;
      if (native && points.length === 0 && !target?.closest("[data-viewer-chrome]")) native.preventDefault();
      if (moved) suppressClickRef.current = true;
      if (result.effect.type === "close") {
        publish(result.gesture, false);
        onCloseRef.current();
        return;
      }
      if (result.effect.type === "step") {
        publish(result.gesture, false);
        goRef.current(result.effect.delta);
        return;
      }
      if (result.effect.type === "tap" && touchInputRef.current) {
        const hit = document.elementFromPoint(result.effect.point.x, result.effect.point.y);
        if (hit?.closest("[data-viewer-chrome]")) {
          publish(result.gesture, false);
          return;
        }
        const onImage = Boolean(hit?.closest("[data-viewer-image]"));
        const now = Date.now();
        if (onImage && isDoubleTap(lastTapRef.current, result.effect.point, now)) {
          lastTapRef.current = null;
          const next = toggleDoubleTap(result.gesture.transform, result.effect.point, origin, box);
          publish({ ...identityGesture(origin), transform: next }, false);
          return;
        }
        lastTapRef.current = { at: now, point: result.effect.point };
        publish(result.gesture, false);
        if (!onImage) onCloseRef.current();
        return;
      }
      publish(result.gesture, false);
    };

    let touched = false;
    let swallowedGhostClick = false;
    const onGhostClick = (event: MouseEvent) => {
      if (!touched || swallowedGhostClick) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-viewer-chrome]")) return;
      swallowedGhostClick = true;
      event.preventDefault();
      event.stopPropagation();
    };
    const onTouchStart = (event: TouchEvent) => {
      touchInputRef.current = true;
      touched = true;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-viewer-chrome]")) return;
      event.preventDefault();
      const points = [...event.touches].map((touch) => ({ x: touch.clientX, y: touch.clientY }));
      const { origin } = metrics();
      publish(beginPointers(gestureRef.current, points, origin), true);
    };
    const onTouchMove = (event: TouchEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-viewer-chrome]") && gestureRef.current.mode === "idle") return;
      event.preventDefault();
      applyMove([...event.touches].map((touch) => ({ x: touch.clientX, y: touch.clientY })));
    };
    const onTouchEnd = (event: TouchEvent) => {
      const points = [...event.touches].map((touch) => ({ x: touch.clientX, y: touch.clientY }));
      finish(points, event);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      touchInputRef.current = false;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-viewer-chrome]")) return;
      node.setPointerCapture?.(event.pointerId);
      const { origin } = metrics();
      publish(beginPointers(gestureRef.current, [{ x: event.clientX, y: event.clientY }], origin), true);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || gestureRef.current.mode === "idle") return;
      applyMove([{ x: event.clientX, y: event.clientY }]);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || gestureRef.current.mode === "idle") return;
      finish([]);
    };
    const onDoubleClick = (event: MouseEvent) => {
      if (touchInputRef.current) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest("[data-viewer-image]")) return;
      event.preventDefault();
      const { origin, frame: box } = metrics();
      const next = toggleDoubleTap(gestureRef.current.transform, { x: event.clientX, y: event.clientY }, origin, box);
      publish({ ...identityGesture(origin), transform: next }, false);
    };
    const onClick = (event: MouseEvent) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (touchInputRef.current) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target || target.closest("[data-viewer-chrome], [data-viewer-image]")) return;
      onCloseRef.current();
    };

    document.addEventListener("click", onGhostClick, true);
    document.addEventListener("keydown", onKey);
    node.addEventListener("touchstart", onTouchStart, { passive: false });
    node.addEventListener("touchmove", onTouchMove, { passive: false });
    node.addEventListener("touchend", onTouchEnd, { passive: false });
    node.addEventListener("touchcancel", onTouchEnd, { passive: false });
    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("pointermove", onPointerMove);
    node.addEventListener("pointerup", onPointerUp);
    node.addEventListener("pointercancel", onPointerUp);
    node.addEventListener("dblclick", onDoubleClick);
    node.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(focusFrame);
      window.setTimeout(() => document.removeEventListener("click", onGhostClick, true), 700);
      document.removeEventListener("keydown", onKey);
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("touchcancel", onTouchEnd);
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("pointercancel", onPointerUp);
      node.removeEventListener("dblclick", onDoubleClick);
      node.removeEventListener("click", onClick);
      unlock();
      if (root) {
        root.inert = previousInert;
        if (previousHidden === null) root.removeAttribute("aria-hidden");
        else root.setAttribute("aria-hidden", previousHidden);
      }
      previouslyFocused?.focus?.();
    };
  }, []);

  if (!photo || typeof document === "undefined") return null;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const dismiss = frame.y > 0 && frame.scale <= 1 ? Math.max(0.4, 1 - frame.y / 420) : 1;
  const side = many ? 60 : 16;
  const stageStyle: CSSProperties = {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 64px)",
    right: `calc(env(safe-area-inset-right) + ${side}px)`,
    bottom: "calc(env(safe-area-inset-bottom) + 64px)",
    left: `calc(env(safe-area-inset-left) + ${side}px)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    touchAction: "none",
  };
  const imageStyle: CSSProperties = {
    maxWidth: "100%",
    maxHeight: "100%",
    width: "auto",
    height: "auto",
    objectFit: "contain",
    transform: `translate3d(${frame.x}px, ${frame.y}px, 0) scale(${frame.scale})`,
    transformOrigin: "center center",
    transition: frame.dragging || reduce ? "none" : "transform 180ms ease-out",
    touchAction: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
    cursor: frame.scale > 1 ? "zoom-out" : "zoom-in",
  };

  return createPortal(
    createElement(
      "div",
      {
        ref: dialogRef,
        className: "tatel-viewer",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Photo viewer",
        style: {
          position: "fixed",
          inset: 0,
          zIndex: 80,
          background: "rgba(7, 20, 33, 0.82)",
          backdropFilter: "blur(18px) saturate(1.15)",
          WebkitBackdropFilter: "blur(18px) saturate(1.15)",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          overscrollBehavior: "none",
          opacity: dismiss,
        },
      },
      createElement("style", null, viewerCss),
      createElement("div", { ref: stageRef, "data-viewer-backdrop": "true", style: stageStyle },
        createElement("img", {
          ref: imageRef,
          "data-viewer-image": "true",
          src: photo.uri,
          alt: photo.alt,
          draggable: false,
          style: imageStyle,
        }),
      ),
      glassButton(closeRef, "Close", { top: "calc(env(safe-area-inset-top) + 10px)", right: "calc(env(safe-area-inset-right) + 10px)" }, onClose, closeIcon),
      many
        ? glassButton(null, "Previous photo", { top: "50%", left: "calc(env(safe-area-inset-left) + 8px)", transform: "translateY(-50%)" }, () => goRef.current(-1), chevron(true), index === 0)
        : null,
      many
        ? glassButton(null, "Next photo", { top: "50%", right: "calc(env(safe-area-inset-right) + 8px)", transform: "translateY(-50%)" }, () => goRef.current(1), chevron(false), index === photos.length - 1)
        : null,
      createElement("p", { style: liveStyle }, many ? `${index + 1} of ${photos.length}. ${photo.alt}` : photo.alt),
      many
        ? createElement("p", { "aria-hidden": true, style: counterStyle }, `${index + 1} / ${photos.length}`)
        : null,
    ),
    document.body,
  );
}

function glassButton(
  buttonRef: { current: HTMLButtonElement | null } | null,
  label: string,
  position: CSSProperties,
  onClick: () => void,
  icon: ReturnType<typeof createElement>,
  disabled = false,
) {
  return createElement(
    "button",
    {
      ref: (node: HTMLButtonElement | null) => {
        if (buttonRef) buttonRef.current = node;
        if (!node) return;
        // The viewer is portaled to document.body, outside the React root, so the
        // click has to be handled on the DOM node itself.
        node.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (node.disabled) return;
          onClick();
        };
      },
      type: "button",
      "data-viewer-chrome": "true",
      "aria-label": label,
      disabled,
      style: { ...buttonStyle, ...position },
    },
    icon,
  );
}

function chevron(previous: boolean) {
  return createElement(
    "svg",
    { width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true, focusable: "false" },
    createElement("path", {
      d: previous ? "M14.5 5 7.5 12l7 7" : "m9.5 5 7 7-7 7",
      fill: "none",
      stroke: IVORY,
      strokeWidth: 1.8,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
  );
}

const closeIcon = createElement(
  "svg",
  { width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true, focusable: "false" },
  createElement("path", {
    d: "M6 6l12 12M18 6 6 18",
    fill: "none",
    stroke: IVORY,
    strokeWidth: 1.8,
    strokeLinecap: "round",
  }),
);

const buttonStyle: CSSProperties = {
  position: "absolute",
  zIndex: 2,
  width: 44,
  height: 44,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.42)",
  background: "rgba(10,18,32,0.55)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
  color: IVORY,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
  touchAction: "manipulation",
};

const counterStyle: CSSProperties = {
  position: "absolute",
  zIndex: 2,
  left: 0,
  right: 0,
  bottom: "calc(env(safe-area-inset-bottom) + 18px)",
  margin: 0,
  textAlign: "center",
  color: GOLD,
  fontFamily: "Manrope-Medium, sans-serif",
  fontSize: 13,
  letterSpacing: 0.4,
  textShadow: "0 1px 2px rgba(0,0,0,0.45)",
};

const liveStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const viewerCss = `
.tatel-viewer button:focus { outline: none; }
.tatel-viewer button:focus-visible { outline: 2px solid ${GOLD}; outline-offset: 3px; }
.tatel-viewer button:disabled { opacity: 0.35; cursor: default; }
@media (prefers-reduced-motion: reduce) {
  .tatel-viewer img { transition: none !important; }
}
`;
