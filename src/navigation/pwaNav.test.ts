import { describe, expect, it, vi } from "vitest";
import { clickPlan, installLinkGuard, isExternalHref } from "./pwaNav";

describe("stay inside the app", () => {
  it("lets the router handle internal links and leaves downloads to the browser", () => {
    let listener: (event: unknown) => void = () => undefined;
    class Target {
      constructor(private href: string, private download = false) {}
      closest() { return this; }
      getAttribute() { return this.href; }
      hasAttribute(name: string) { return name === "download" && this.download; }
    }
    const open = vi.fn(() => ({}));
    vi.stubGlobal("Element", Target);
    vi.stubGlobal("window", { location: { origin: "https://tatel.app" }, open });
    vi.stubGlobal("document", { addEventListener: (_: string, callback: typeof listener) => { listener = callback; }, removeEventListener: vi.fn() });
    try {
      const cleanup = installLinkGuard();
      for (const target of [new Target("/agenda?day=2027-01-28"), new Target("blob:https://tatel.app/notebook", true)]) {
        const preventDefault = vi.fn(); listener({ target, button: 0, preventDefault, stopPropagation: vi.fn() });
        expect(preventDefault).not.toHaveBeenCalled();
      }
      const preventDefault = vi.fn(); listener({ target: new Target("https://www.lovangovi.com/"), button: 0, preventDefault, stopPropagation: vi.fn() });
      expect(preventDefault).toHaveBeenCalledOnce(); expect(open).toHaveBeenCalledOnce(); cleanup();
    } finally { vi.unstubAllGlobals(); }
  });
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
