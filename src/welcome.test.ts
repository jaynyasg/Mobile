import { describe, expect, it } from "vitest";
import { forum, passes, stays } from "./content";
import { WELCOME_KEY, hasSeenWelcome, markWelcomeSeen, welcomePages } from "./welcome";

function memory() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("first-visit welcome", () => {
  it("shows until the visit is stored, then stays dismissed", () => {
    const storage = memory();
    expect(hasSeenWelcome(storage)).toBe(false);
    expect(hasSeenWelcome(null)).toBe(false);
    markWelcomeSeen(storage);
    expect(storage.values.get(WELCOME_KEY)).toBe("1");
    expect(hasSeenWelcome(storage)).toBe(true);
    markWelcomeSeen(null);
  });

  it("builds the guide from the program fields", () => {
    const pages = welcomePages({
      name: forum.name,
      edition: forum.edition,
      kicker: forum.kicker,
      dateLabel: forum.dateLabel,
      placeLabel: forum.placeLabel,
      pillars: forum.pillars,
      days: forum.days,
      staysIntro: stays.intro,
      passNote: "The pass is a design preview. No payment is collected.",
    });
    expect(pages.map((page) => page.id)).toEqual(["what", "islands", "sessions", "around", "together"]);
    expect(pages[0]?.kicker).toBe("Conversations");
    expect(pages[0]?.title).toBe(forum.kicker);
    expect(pages[0]?.body).toContain(forum.dateLabel);
    expect(pages[1]?.body).toContain("St. Thomas");
    expect(pages[1]?.body).toContain("Tech");
    expect(pages[2]?.title).toBe("Your schedule");
    expect(pages[2]?.body).toContain("The Problem");
    expect(pages[3]?.body.toLowerCase()).toContain("unconfirmed");
    expect(pages[4]?.install).toBe(true);
    expect(pages[4]?.body).toContain("No payment");
    expect(passes.previewLabel.toLowerCase()).toContain("no payment");
  });
});
