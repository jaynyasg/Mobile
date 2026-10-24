import type { Attendee } from "../content/types";

export function visibleAttendees(people: Attendee[], query: string): Attendee[] {
  const needle = query.trim().toLowerCase();
  return people.filter((person) => {
    if (!person.networkingOptIn) return false;
    if (!needle) return true;
    const haystack = [person.name, person.title, person.company, person.bio, ...person.interests]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}
