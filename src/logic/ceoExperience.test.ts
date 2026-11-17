import { describe, expect, it } from "vitest";
import { bundle } from "../content/bundle";
import { applyExperienceContent } from "../content/experience";
import { parseContent } from "../content/schema";
import { availableNeeds, ISLAND_NEEDS, sessionNeeds } from "./islandNeeds";
import { guidedSessions } from "./sessionGuide";
import { connectedSessions } from "./sessionJourney";
import { buildRoute, routePins } from "./customRoute";
import { canConfirmStay, providerPreview } from "./providerPreview";
import { emptyWorkNote, readWorkNote, saveWorkNote, workNoteText, WORK_KEY } from "./workNotes";
import { saveEntryIntent, takeEntryIntent } from "./entryIntent";

function memory() { const data = new Map<string, string>(); return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } }; }
describe("CEO experience integration", () => {
  it("keeps approved geography through remote refreshes without moving other sessions or editing people and media", () => {
    const old = { ...bundle, sessions: bundle.sessions.map(s => s.island === "Near Tortola" ? { ...s, island: "Jost Van Dyke" } : s) };
    const result = parseContent(old, bundle);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.program.sessions.some(s => s.island === "Jost Van Dyke" || s.island === "St. Croix")).toBe(false);
    expect(result.program.sessions.find(s => s.id === "E5-D1")?.island).toBe("St. Thomas");
    const normalized = applyExperienceContent(old);
    expect(normalized.panelists).toBe(old.panelists);
    expect(normalized.scenes).toBe(old.scenes);
    expect(normalized.sessions.find(s => s.island === "Near Tortola")?.venue.venueId).toBe("near-tortola");
    expect(normalized.places.some(p => p.id === "hideout-white-bay")).toBe(false);
    expect(applyExperienceContent(normalized)).toEqual(normalized);
  });
  it("offers all eight needs with actual matches, combining areas without duplicates", () => {
    const all = availableNeeds(bundle.sessions, []);
    expect(all.map(n => n.id)).toEqual(ISLAND_NEEDS.map(n => n.id));
    const combined = availableNeeds(bundle.sessions, ["tech", "travel"]);
    expect(combined.find(n => n.id === "need:food")?.areaIds.sort()).toEqual(["tech", "travel"]);
    const matches = guidedSessions(bundle.sessions, { areas: ["tech", "travel"], interests: ["need:food"], goals: [] });
    expect(matches.length).toBeGreaterThan(4);
    expect(matches.every(s => sessionNeeds(s).includes("need:food"))).toBe(true);
    expect(new Set(matches.map(s => s.dayId)).size).toBe(4);
    const legacy = guidedSessions(bundle.sessions, { areas: ["tech"], interests: ["AgriTech"], goals: [] });
    expect(legacy.length).toBeGreaterThan(0);
  });
  it("connects a real workstream across four days and does not invent transfer times or pins", () => {
    const first = bundle.sessions.find(s => s.id === "T2-D1")!;
    expect(connectedSessions(bundle.sessions, first).map(s => s.dayId)).toEqual(bundle.forum.days.map(d => d.id));
    const near = bundle.sessions.find(s => s.island === "Near Tortola" && s.dayId === first.dayId)!;
    const route = buildRoute([{ ...first, venue: undefined }, { ...near, venue: undefined }], bundle.transport.modes);
    const leg = route.flatMap(d => d.stops).find(s => s.leg)?.leg;
    expect(leg?.depart).toBeNull(); expect(leg?.arrive).toBeNull();
    expect(leg?.duration).toMatch(/pending/);
    expect(routePins(route).some(pin => pin.island === "Near Tortola")).toBe(false);
  });
  it("supports provider windows and explicit fallbacks without unsafe URLs", () => {
    const land = "On the beach or on land";
    expect(canConfirmStay(land, { name: "Lovango Resort", href: "https://www.lovangovi.com/accommodations/" })).toBe(true);
    expect(canConfirmStay(land, { name: "Caribbean Beach Club", href: "https://www.lovangovi.com/beach-club/" })).toBe(false);
    expect(canConfirmStay("On the boat", { name: "Marina", href: "https://example.com" })).toBe(false);
    const ritz = bundle.stays.groups.flatMap(group => group.islands).flatMap(island => island.sections).flatMap(section => section.providers).find(provider => provider.name === "The Ritz-Carlton, St. Thomas");
    expect(ritz?.localDeck).toBe(false); expect(ritz?.href).toContain("ritzcarlton.com");
    expect(providerPreview("https://www.lovangovi.com/accommodations/")?.embedded).toBe(true);
    expect(providerPreview("https://booking.marriott.com/rooms")?.embedded).toBe(false);
    for (const url of ["javascript:alert(1)", "http://example.com", "https://localhost", "https://127.0.0.1", "https://[::1]", "https://user:pass@example.com", "https://tatel.app"]) expect(providerPreview(url)).toBeNull();
  });
  it("saves and exports notes by series, tolerates corruption and reports storage failures", () => {
    const store = memory(); const note = { ...emptyWorkNote(), problem: "Local food access", next: "Pilot with growers" };
    expect(saveWorkNote(store, "T2", note)).toBe(true);
    expect(readWorkNote(store, "T2")).toEqual(note);
    expect(readWorkNote(store, "T3")).toEqual(emptyWorkNote());
    expect(workNoteText("Food", note)).toContain("Pilot with growers");
    store.setItem(WORK_KEY, "broken"); expect(readWorkNote(store, "T2")).toEqual(emptyWorkNote());
    expect(saveWorkNote(store, "__proto__", note)).toBe(false);
    expect(saveWorkNote({ ...store, setItem: () => { throw new Error("full"); } }, "T2", note)).toBe(false);
  });
  it("consumes each opening choice only once", () => {
    const store = memory(); saveEntryIntent(store, "stay");
    expect(takeEntryIntent(store)).toBe("stay"); expect(takeEntryIntent(store)).toBeNull();
    expect(takeEntryIntent({ ...store, getItem: () => { throw new Error("blocked"); } })).toBeNull();
  });
});
