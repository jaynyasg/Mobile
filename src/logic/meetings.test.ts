import { describe, expect, it } from "vitest";
import { meetingSlots, sessions } from "../content";
import { evaluateMeeting } from "./meetings";

describe("meeting requests during keynotes", () => {
  it("blocks a slot that overlaps a keynote and allows lunch", () => {
    const morning = meetingSlots.find((slot) => slot.id === "tue-morning");
    const lunch = meetingSlots.find((slot) => slot.id === "wed-lunch");
    const closing = meetingSlots.find((slot) => slot.id === "thu-closing");
    expect(morning && lunch && closing).toBeTruthy();
    if (!morning || !lunch || !closing) return;

    const blocked = evaluateMeeting(morning, sessions);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.session.id).toBe("keynote-attention");

    expect(evaluateMeeting(lunch, sessions).ok).toBe(true);

    const duringClosing = evaluateMeeting(closing, sessions);
    expect(duringClosing.ok).toBe(false);
    if (!duringClosing.ok) expect(duringClosing.session.id).toBe("closing");
  });
});
