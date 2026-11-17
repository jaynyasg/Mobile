import type { IntakeStore } from "./intake";
export const WORK_KEY = "tatel.work.v1";
export const WORK_FIELDS = [
  { id: "problem", label: "The island need", prompt: "Who is affected, and what needs to change?" },
  { id: "solution", label: "The proposed solution", prompt: "What will you try, and who should help shape it?" },
  { id: "test", label: "The use case and test", prompt: "What did you build or apply? How will you test it with users?" },
  { id: "learning", label: "Results and learning", prompt: "What worked, what did not, and what evidence do you have?" },
  { id: "next", label: "Next step and owner", prompt: "Who takes this forward? What is needed for a pilot or expansion?" },
  { id: "review", label: "Annual review", prompt: "When will you revisit the work, and what progress will you look for?" },
] as const;
export type WorkNote = Record<typeof WORK_FIELDS[number]["id"], string>;
export function emptyWorkNote(): WorkNote { return { problem: "", solution: "", test: "", learning: "", next: "", review: "" }; }
export function readWorkNote(store: IntakeStore | null, id: string): WorkNote {
  try { const notes = JSON.parse(store?.getItem(WORK_KEY) ?? "{}"); const note = notes[id]; return Object.fromEntries(WORK_FIELDS.map(field => [field.id, typeof note?.[field.id] === "string" ? note[field.id] : ""])) as WorkNote; } catch { return emptyWorkNote(); }
}
export function saveWorkNote(store: IntakeStore | null, id: string, note: WorkNote): boolean {
  if (!store || !id || ["__proto__", "constructor", "prototype"].includes(id)) return false;
  try {
    let existing: Record<string, unknown> = {};
    try { const parsed = JSON.parse(store.getItem(WORK_KEY) ?? "{}"); if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) existing = parsed; } catch { /* Start with a readable notebook. */ }
    existing[id] = Object.fromEntries(WORK_FIELDS.map(field => [field.id, note[field.id].slice(0, 4000)]));
    store.setItem(WORK_KEY, JSON.stringify(existing));
    return true;
  } catch { return false; }
}
export function workNoteText(title: string, note: WorkNote): string { return [`TATEL · ${title}`, ...WORK_FIELDS.map(field => `${field.label}\n${note[field.id] || "Not recorded yet"}`)].join("\n\n"); }
