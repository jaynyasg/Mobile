import { describe, expect, it } from "vitest";
import { answerQuestion } from "./assistant";

describe("on-device guide", () => {
  it("answers from the program instead of a general model", () => {
    const mira = answerQuestion("When does Mira Chen speak?");
    expect(mira.text).toContain("A longer attention");
    expect(mira.text).toContain("PST");
    expect(mira.citations.some((citation) => citation.id === "mira-chen")).toBe(true);

    const hall = answerQuestion("Where is Harbor Hall?");
    expect(hall.text).toContain("Lantern Steps");

    const walk = answerQuestion("What is the Studio Walk?");
    expect(walk.text).toContain("Arcade");

    const deletion = answerQuestion("How do I delete my data?");
    expect(deletion.text).toContain("Settings");

    expect(answerQuestion("asdfghjkl").text).toContain("I only know the Portico program");
  });
});
