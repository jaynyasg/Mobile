import { describe, expect, it } from "vitest";
import { answerQuestion } from "./assistant";

describe("on-device guide", () => {
  it("answers from the TATEL draft instead of a general model", () => {
    const malik = answerQuestion("When does Malik Elizee appear?");
    expect(malik.text).toContain("Malik Elizee");
    expect(malik.text).toContain("AST");
    expect(malik.citations.some((citation) => citation.id === "malik-elizee")).toBe(true);

    const island = answerQuestion("Where is the Tech pillar?");
    expect(island.text).toContain("St. Thomas");

    const boat = answerQuestion("What is the conference powerboat?");
    expect(boat.text.toLowerCase()).toContain("unconfirmed");

    const deletion = answerQuestion("How do I delete my data?");
    expect(deletion.text).toContain("Settings");

    expect(answerQuestion("asdfghjkl").text).toContain("TATEL Conversations");
  });
});
