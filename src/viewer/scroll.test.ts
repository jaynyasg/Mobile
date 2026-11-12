import { describe, expect, it } from "vitest";
import { lockScroll, type ScrollHost } from "./scroll";

describe("viewer scroll lock", () => {
  it("freezes the page and restores the previous scroll offset", () => {
    const host: ScrollHost = {
      scrollY: 240,
      documentElement: { style: { overflow: "auto" } },
      body: { style: { overflow: "", position: "", top: "", width: "", left: "", right: "" } },
      scrollTo: (x, y) => {
        host.scrollY = y;
        void x;
      },
    };
    const unlock = lockScroll(host);
    expect(host.body.style.position).toBe("fixed");
    expect(host.body.style.top).toBe("-240px");
    expect(host.body.style.overflow).toBe("hidden");
    expect(host.documentElement.style.overflow).toBe("hidden");
    host.scrollY = 0;
    unlock();
    expect(host.body.style.position).toBe("");
    expect(host.body.style.top).toBe("");
    expect(host.documentElement.style.overflow).toBe("auto");
    expect(host.scrollY).toBe(240);
  });
});
