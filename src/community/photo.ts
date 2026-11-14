interface PickedPhoto {
  file: Blob;
  extension: string;
}

interface FileInput {
  type: string;
  accept: string;
  files?: ArrayLike<Blob & { type?: string }> | null;
  onchange: (() => void) | null;
  click: () => void;
}

function webDocument(): { createElement: (tag: string) => FileInput } | null {
  const host = globalThis as { document?: { createElement: (tag: string) => FileInput } };
  return host.document ?? null;
}

export async function compressCommunityPhoto(file: Blob): Promise<PickedPhoto> {
  const host = globalThis as {
    document?: { createElement: (tag: string) => { width: number; height: number; getContext: (kind: string) => { drawImage: (image: ImageBitmap, x: number, y: number, w: number, h: number) => void } | null; toBlob: (done: (blob: Blob | null) => void, type: string, quality: number) => void } };
    createImageBitmap?: (blob: Blob) => Promise<ImageBitmap & { close?: () => void }>;
  };
  if (!host.document || !host.createImageBitmap) {
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    return { file, extension };
  }
  const bitmap = await host.createImageBitmap(file);
  const max = 512;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = host.document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return { file, extension: "jpg" };
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) return { file, extension: "jpg" };
  return { file: blob, extension: "webp" };
}

export function pickCommunityPhoto(): Promise<PickedPhoto | null> {
  const documentRef = webDocument();
  if (!documentRef) return Promise.resolve(null);
  return new Promise((resolve) => {
    const input = documentRef.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      resolve({ file, extension });
    };
    input.click();
  });
}
