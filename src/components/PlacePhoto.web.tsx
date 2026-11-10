import { createElement } from "react";
import type { PlacePhoto as Photo } from "@/content/types";

export function PlacePhoto({ photo, eager = false }: { photo: Photo; eager?: boolean }) {
  return createElement(
    "picture",
    null,
    createElement("source", {
      type: "image/webp",
      srcSet: `${photo.webp640} 640w, ${photo.webp1280} 1280w`,
      sizes: "(max-width: 480px) 100vw, 440px",
    }),
    createElement("img", {
      src: photo.jpeg,
      alt: photo.alt,
      loading: eager ? "eager" : "lazy",
      decoding: "async",
      style: { width: "100%", height: 220, objectFit: "cover", backgroundColor: "#071B2A", display: "block" },
    }),
  );
}
