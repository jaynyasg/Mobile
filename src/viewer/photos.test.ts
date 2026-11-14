import { describe, expect, it } from "vitest";
import { imageUrlsIn, viewerPhotos } from "./photos";

describe("viewer photos", () => {
  it("keeps alt text and drops empty sources", () => {
    expect(viewerPhotos([
      { uri: "/venues/a.webp", alt: " Dock at dusk " },
      { uri: "", alt: "Missing" },
      { uri: "/venues/b.webp", alt: "  " },
    ])).toEqual([
      { uri: "/venues/a.webp", alt: "Dock at dusk" },
      { uri: "/venues/b.webp", alt: "Photo" },
    ]);
  });

  it("reads image links out of a chat message", () => {
    const text = "See https://cdn.test/beach.JPG?w=1200, and https://cdn.test/notes.pdf. Again https://cdn.test/beach.JPG?w=1200";
    expect(imageUrlsIn(text)).toEqual(["https://cdn.test/beach.JPG?w=1200"]);
    expect(imageUrlsIn("")).toEqual([]);
    expect(imageUrlsIn("no photo here")).toEqual([]);
    expect(imageUrlsIn("https://cdn.test/a.png https://cdn.test/b.webp")).toEqual([
      "https://cdn.test/a.png",
      "https://cdn.test/b.webp",
    ]);
  });
});
