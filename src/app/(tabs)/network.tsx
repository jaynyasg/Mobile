import { useMemo, useState } from "react";
import { View } from "react-native";
import { pillarById } from "@/content";
import { useContent } from "@/content/provider";
import { PersonRow } from "@/components/PersonRow";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { T } from "@/components/Text";
import { EmptyState, PageHeader, PrimaryButton, SecondaryButton } from "@/components/ui";
import { portraits } from "@/images";
import { searchPanelists } from "@/logic/directory";
import { useApp } from "@/store";
import { backgrounds } from "@/components/backgrounds";
import { colors, pad } from "@/theme";

export default function NetworkScreen() {
  const { program } = useContent();
  const { panelists } = program;
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState("");
  const visible = useMemo(() => searchPanelists(panelists, query), [query]);

  return (
    <Screen docked photo={backgrounds.network.day} night={backgrounds.network.night} phase={backgrounds.network.phase}>
      <PageHeader
        kicker="On this device"
        title="Network"
        subtitle="Opt in to open a local note next to a panelist. Nothing is sent. The roster is published panelist information, not a confirmed opt-in directory."
      />
      <View style={{ paddingHorizontal: pad, gap: 10 }}>
        {state.networkingOptIn ? (
          <SecondaryButton label="Leave the local directory" onPress={() => dispatch({ type: "setNetworkingOptIn", value: false })} />
        ) : (
          <PrimaryButton label="Opt in on this device" onPress={() => dispatch({ type: "setNetworkingOptIn", value: true })} />
        )}
        <T variant="meta" color={colors.inkSoft}>
          {state.networkingOptIn ? "Local notes are unlocked." : "The roster stays hidden until you opt in."}
        </T>
      </View>
      {state.networkingOptIn ? (
        <>
          <View style={{ paddingHorizontal: pad, paddingTop: 12 }}>
            <SearchField value={query} onChange={setQuery} placeholder="Find a panelist" />
          </View>
          {visible.length === 0 ? (
            <EmptyState title="No match" body="Try another name from the roster." />
          ) : (
            visible.map((person) => {
              const pillar = pillarById(person.proposedPillarId);
              return (
                <PersonRow
                  key={person.id}
                  name={person.name}
                  photo={person.photo ? portraits[person.photo] : undefined}
                  meta={`${person.company} · ${pillar?.name ?? person.proposedIsland}`}
                  href={{ pathname: "/chat/[id]", params: { id: person.id } }}
                />
              );
            })
          )}
        </>
      ) : null}
    </Screen>
  );
}
