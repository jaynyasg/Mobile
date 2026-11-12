export function commentLabel(count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return `${safe} ${safe === 1 ? "comment" : "comments"}`;
}
