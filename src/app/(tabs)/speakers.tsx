import { useMemo, useState } from "react";
import { pillarById } from "@/content";
import { useContent } from "@/content/provider";
import { PersonRow } from "@/components/PersonRow";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { EmptyState, PageHeader } from "@/components/ui";
import { portraits } from "@/images";
import { searchPanelists } from "@/logic/directory";
import { pad } from "@/theme";
import { View } from "react-native";

export default function PanelistsScreen() {
  const { program } = useContent();
  const { forum, panelists } = program;
  const [query, setQuery] = useState("");
  const visible = useMemo(() => searchPanelists(panelists, query), [query]);

  return (
    <Screen>
      <PageHeader
        kicker={`${panelists.length} panelists`}
        title="Panelists"
        subtitle="Names, companies, and titles come from the website roster. A portrait appears when its file is already in the app."
      />
      <View style={{ paddingHorizontal: pad, paddingBottom: 8 }}>
        <SearchField value={query} onChange={setQuery} placeholder="Name, company, or title" />
      </View>
      {visible.length === 0 ? (
        <EmptyState title="No one by that name" body="Try a company or a title from the roster." />
      ) : (
        visible.map((person) => {
          const pillar = pillarById(person.proposedPillarId);
          return (
            <PersonRow
              key={person.id}
              name={person.name}
              photo={person.photo ? portraits[person.photo] : undefined}
              meta={`${person.title} · ${person.company}\n${pillar?.name || "Program to be announced"} · ${person.proposedIsland || "Location TBC"}`}
              href={{ pathname: "/speaker/[id]", params: { id: person.id } }}
            />
          );
        })
      )}
      <View style={{ height: 12 }} />
      <PageHeader kicker="Planning homes" title={forum.edition} subtitle="Scene choice and profile choice stay independent. A portrait does not confirm a venue." />
    </Screen>
  );
}
