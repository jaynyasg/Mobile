import { describe, expect, it } from "vitest";
import { joinLine } from "./labels";

describe("joinLine", () => {
  it("drops empty parts so a title does not end with a dangling separator", () => {
    expect(joinLine(["CEO", ""])).toBe("CEO");
    expect(joinLine(["", "TATEL"])).toBe("TATEL");
    expect(joinLine(["Founder", "TATEL"])).toBe("Founder · TATEL");
    expect(joinLine(["  ", null, undefined])).toBe("");
  });
});
