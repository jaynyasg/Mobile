export function activeTrackIds(trackIds: readonly string[], pillars: readonly { id: string }[]): string[] {
  const wanted = new Set(trackIds);
  const known = pillars.filter((pillar) => wanted.has(pillar.id)).map((pillar) => pillar.id);
  if (known.length === 0 || known.length >= pillars.length) return [];
  return known;
}

export function islandsForTracks(trackIds: readonly string[], pillars: readonly { id: string; island: string }[]): string[] {
  const active = new Set(activeTrackIds(trackIds, pillars));
  const islands: string[] = [];
  for (const pillar of pillars) {
    if (active.has(pillar.id) && !islands.includes(pillar.island)) islands.push(pillar.island);
  }
  return islands;
}

export function sameIslands(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const wanted = new Set(left);
  return right.every((island) => wanted.has(island));
}
