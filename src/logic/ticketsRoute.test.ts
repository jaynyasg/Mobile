import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STAMPS_KEY } from "@/guide/stamps";
import { ticketsLocation } from "./ticketsRoute";

describe("tickets route", () => {
  it("keeps a checkout return on the new path", () => {
    expect(ticketsLocation()).toBe("/tickets");
    expect(ticketsLocation({ checkout: "return", session_id: "cs_live_123", tier: "beach" })).toBe(
      "/tickets?checkout=return&tier=beach&session_id=cs_live_123",
    );
    expect(ticketsLocation({ checkout: "", tier: null, session_id: null })).toBe("/tickets");
  });

  it("points the section at Tickets and leaves stamps on the same key", () => {
    const dock = readFileSync("src/components/Dock.tsx", "utf8");
    const tickets = readFileSync("src/app/(tabs)/tickets.tsx", "utf8");
    const explore = readFileSync("src/app/(tabs)/explore.tsx", "utf8");
    const card = readFileSync("src/components/StampCard.tsx", "utf8");
    const redirect = readFileSync("src/app/passport.tsx", "utf8");
    const share = readFileSync("src/app/pass/vip/[code].tsx", "utf8");
    const booking = readFileSync("worker/vipBooking.ts", "utf8");
    expect(dock).toContain('label: "Tickets"');
    expect(dock).not.toContain("Passport");
    expect(tickets).toContain("PassCheckout");
    expect(tickets).toContain("VipStart");
    expect(tickets).not.toMatch(/Your passport|Fill your passport|readStamps|islandStamp/i);
    expect(explore).toContain("StampCard");
    expect(card).toContain("Stamp card");
    expect(card).toContain("infrastructures");
    expect(card).toContain("readStamps");
    expect(card).toContain("islandStamp");
    expect(STAMPS_KEY).toBe("tatel.stamps");
    expect(redirect).toContain("ticketsLocation");
    expect(share).toContain("/api/vip-booking/");
    expect(booking).toContain("/pass/vip/");
    expect(readFileSync("src/app/(tabs)/more.tsx", "utf8")).toContain('label: "Tickets"');
    expect(readFileSync("src/app/(tabs)/index.tsx", "utf8")).toContain('"/tickets"');
    expect(readFileSync("src/app/(tabs)/tickets.tsx", "utf8")).toContain('hold.owned ? "Your pass" : "Choose a pass"');
    expect(readFileSync("src/logic/pathPlan.ts", "utf8")).not.toMatch(/Add your pass|Get your pass|get a pass/i);
  });
});
