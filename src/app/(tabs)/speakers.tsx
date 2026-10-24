import { useState } from "react";
import { speakers, sessionsForSpeaker } from "@/content";
import { PersonRow } from "@/components/PersonRow";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { EmptyState, PageHeader } from "@/components/ui";

export default function SpeakersScreen() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const list = speakers.filter((speaker) => {
    if (!needle) return true;
    return `${speaker.name} ${speaker.title} ${speaker.company} ${speaker.bio}`.toLowerCase().includes(needle);
  });

  return (
    <Screen>
      <PageHeader kicker="Program" title="Speakers" subtitle={`${speakers.length} people on the program.`} />
      <SearchField value={query} onChange={setQuery} placeholder="Search speakers" />
      {list.length === 0 ? (
        <EmptyState title="No one by that name" body="Try a company, or part of a name." />
      ) : (
        list.map((speaker) => (
          <PersonRow
            key={speaker.id}
            name={speaker.name}
            meta={`${speaker.title}, ${speaker.company} · ${sessionsForSpeaker(speaker.id).length} on the program`}
            href={{ pathname: "/speaker/[id]", params: { id: speaker.id } }}
          />
        ))
      )}
    </Screen>
  );
}
