import { describe, expect, it } from "vitest";
import { commentLabel } from "./copy";

describe("comment label", () => {
  it("uses the singular only for one comment", () => {
    expect(commentLabel(0)).toBe("0 comments");
    expect(commentLabel(1)).toBe("1 comment");
    expect(commentLabel(2)).toBe("2 comments");
  });
});
