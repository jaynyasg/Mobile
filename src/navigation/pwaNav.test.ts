import { describe, expect, it } from "vitest";
import { clickPlan, isExternalHref } from "./pwaNav";

describe("stay inside the app", () => {
  it("keeps TATEL links in the app and sends maps and hotels out", () => {
    expect(isExternalHref("/routes?build=1")).toBe(false);
    expect(isExternalHref("https://tatel.app/agenda", "https://tatel.app")).toBe(false);
    expect(isExternalHref("https://www.google.com/maps/dir/?api=1")).toBe(true);
    expect(isExternalHref("https://www.emeraldbeach.com")).toBe(true);
    expect(clickPlan("/tickets", "https://tatel.app")).toBe("inside");
    expect(clickPlan("https://www.lindberghbayhotelandvillas.com/", "https://tatel.app")).toBe("external");
    expect(clickPlan("#top", "https://tatel.app")).toBe("ignore");
  });
});
