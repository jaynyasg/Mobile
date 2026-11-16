import { describe, expect, it } from "vitest";
import { confirmAccommodation, INTAKE_KEY, notePassPurchased, readIntake, writeIntake, type IntakeStore } from "./intake";

function memory(): IntakeStore & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("pass purchase", () => {
  it("preserves ticket preferences and confirmed accommodation through purchase and reload", () => {
    const store = memory();
    writeIntake(store, { hasPass: "not-yet", areas: ["law"], needsStay: "yes", completed: [], interests: [], ticketPreference: "boat" });
    confirmAccommodation(store, { island: "St. Thomas", name: "Example hotel" });
    notePassPurchased(store);
    expect(readIntake(store)).toMatchObject({ ticketPreference: "boat", accommodation: { island: "St. Thomas", name: "Example hotel" }, completed: ["stay", "pass"] });
  });
  it("does not treat legacy screen visits as completed bookings", () => {
    const store = memory();
    store.setItem(INTAKE_KEY, JSON.stringify({ hasPass: "not-yet", needsStay: "yes", areas: [], completed: ["pass", "stay", "sessions"] }));
    expect(readIntake(store)?.completed).toEqual([]);
  });
  it("marks an existing path as holding a pass without dropping the stay answer", () => {
    const store = memory();
    writeIntake(store, { hasPass: "not-yet", areas: ["tech"], needsStay: "yes", completed: ["sessions"], interests: [] });
    expect(notePassPurchased(store)).toEqual({
      hasPass: "not-yet",
      areas: ["tech"],
      needsStay: "yes",
      completed: ["sessions", "pass"],
      interests: [],
    });
    expect(readIntake(store)?.hasPass).toBe("not-yet");
    expect(readIntake(store)?.completed).toContain("pass");
  });

  it("remembers a purchase when questions have not been answered yet", () => {
    const store = memory();
    notePassPurchased(store);
    expect(readIntake(store)).toEqual({ hasPass: "have", areas: [], needsStay: "browsing", completed: ["pass"], interests: [] });
  });

  it("keeps a skipped question as skipped", () => {
    const store = memory();
    writeIntake(store, { hasPass: "skipped", areas: [], needsStay: "skipped", completed: [], interests: [] });
    expect(readIntake(store)).toEqual({ hasPass: "skipped", areas: [], needsStay: "skipped", completed: [], interests: [] });
  });

  it("lets a retake replace the purchased answer", () => {
    const store = memory();
    notePassPurchased(store);
    writeIntake(store, { hasPass: "not-yet", areas: ["ai"], needsStay: "yes", completed: [], interests: [] });
    expect(readIntake(store)).toMatchObject({ hasPass: "not-yet", needsStay: "yes", completed: [] });
  });
});
