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
