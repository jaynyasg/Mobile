export type ByteRange = { start: number; end: number };

// One `bytes=` range. A multi-range header is left to the caller, which sends the whole file.
export function parseSingleRange(header: string, size: number): ByteRange | "unsatisfiable" | null {
  const value = header.trim().toLowerCase();
  if (!value.startsWith("bytes=")) return null;
  const spec = value.slice("bytes=".length).trim();
  if (!spec || spec.includes(",")) return null;
  const match = /^(\d*)-(\d*)$/.exec(spec);
  if (!match || size < 0) return null;
  const startText = match[1] ?? "";
  const endText = match[2] ?? "";
  if (startText === "" && endText === "") return null;
  if (size === 0) return "unsatisfiable";

  if (startText === "") {
    const suffix = Number(endText);
    if (!Number.isInteger(suffix) || suffix <= 0) return "unsatisfiable";
    const length = Math.min(suffix, size);
    return { start: size - length, end: size - 1 };
  }

  const start = Number(startText);
  if (!Number.isInteger(start) || start < 0) return null;
  if (start >= size) return "unsatisfiable";
  const end = endText === "" ? size - 1 : Number(endText);
  if (!Number.isInteger(end) || end < start) return "unsatisfiable";
  return { start, end: Math.min(end, size - 1) };
}
