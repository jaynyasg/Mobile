import type { Panelist } from "../content/types";

export function searchPanelists(people: Panelist[], query: string): Panelist[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return people;
  return people.filter((person) => {
    const haystack = `${person.name} ${person.title} ${person.company}`.toLowerCase();
    return haystack.includes(needle);
  });
}
