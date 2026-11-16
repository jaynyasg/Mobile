import { describe, expect, it } from "vitest";
import { closeTopOverlay, notePath, popPath, previousPath, registerOverlay, resetAppHistory } from "./appHistory";

describe("in-app back", () => {
  it("returns to the previous screen and closes an overlay first", () => {
    resetAppHistory();
    notePath("/");
    notePath("/agenda");
    notePath("/session/a");
    expect(previousPath()).toBe("/agenda");
    expect(popPath()).toBe("/agenda");
    notePath("/agenda");
    expect(previousPath()).toBe("/");
    let closed = 0;
    const drop = registerOverlay(() => {
      closed += 1;
    });
    expect(closeTopOverlay()).toBe(true);
    expect(closed).toBe(1);
    expect(closeTopOverlay()).toBe(false);
    drop();
    resetAppHistory();
  });
});
