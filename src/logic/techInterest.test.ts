import { describe, expect, it } from "vitest";
import { sessions } from "../content";
import { phaseTag, sessionInterest, suggestSessions } from "./techInterest";

describe("tech interests on sessions", () => {
  it("tags a session with a subcategory and a day kind", () => {
    const harvest = sessions.find((session) => session.title === "The Harvest Nobody Can Find");
    const classroom = sessions.find((session) => session.title === "The Classroom and the Job Do Not Connect");
    expect(harvest && sessionInterest(harvest)).toBe("AgriTech");
    expect(classroom && sessionInterest(classroom)).toBe("EdTech");
    expect(phaseTag("The Problem")).toBe("Problem");
    expect(phaseTag("Build")).toBe("Build");
    expect(phaseTag("Showcase")).toBe("Showcase");
    const picked = suggestSessions(sessions, ["AgriTech"], ["tech"], 4);
    expect(picked.some((session) => session.title === "The Harvest Nobody Can Find")).toBe(true);
    expect(picked.map((session) => session.title).join(" ")).not.toMatch(/topic to be announced/i);
  });
});
