import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { ViewerPhoto } from "@/viewer/photos";
import { ImageViewerOverlay } from "./ImageViewerOverlay";

interface Session {
  photos: ViewerPhoto[];
  index: number;
  token: number;
}

interface ImageViewerApi {
  open: (photos: ViewerPhoto[], index?: number) => void;
  close: () => void;
}

const ImageViewerContext = createContext<ImageViewerApi | null>(null);

export function ImageViewerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const close = useCallback(() => setSession(null), []);
  const open = useCallback((photos: ViewerPhoto[], index = 0) => {
    const usable = photos.filter((photo) => photo.uri);
    if (!usable.length) return;
    const nextIndex = Math.min(usable.length - 1, Math.max(0, index));
    setSession((current) => ({ photos: usable, index: nextIndex, token: (current?.token ?? 0) + 1 }));
  }, []);
  const api = useMemo(() => ({ open, close }), [open, close]);
  return (
    <ImageViewerContext.Provider value={api}>
      {children}
      {session ? <ImageViewerOverlay key={session.token} photos={session.photos} initialIndex={session.index} onClose={close} /> : null}
    </ImageViewerContext.Provider>
  );
}

export function useImageViewer(): ImageViewerApi {
  const value = useContext(ImageViewerContext);
  if (!value) throw new Error("Image viewer is unavailable");
  return value;
}
