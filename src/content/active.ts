import { bundle } from "./bundle";
import type { ProgramData } from "./types";

let current: ProgramData = bundle;

export function getProgram(): ProgramData {
  return current;
}

export function setProgram(next: ProgramData) {
  current = next;
}
