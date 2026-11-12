import { StyleSheet, View } from "react-native";
import { useState } from "react";
import { TappablePhoto } from "@/components/TappablePhoto";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { Chip } from "@/components/ui";
import { ilmaPages } from "@/images";
import { pad } from "@/theme";
import { nightGlass } from "@/components/nightGlass";

export default function DeckScreen() {
  const [page, setPage] = useState(0);
  return (
    <Screen edge="none">
      <StackHeader title="Ilma deck plans" />
      <View style={styles.pad}>
        <T variant="eyebrow">The Ritz-Carlton, St. Thomas</T>
        <T variant="small">
          These are the supplied page images. The original PDF was omitted from the export, so this preview shows the pages that were included.
        </T>
      </View>
      <View style={styles.pages}>
        {ilmaPages.map((_, index) => (
          <Chip key={index} label={String(index + 1)} selected={page === index} onPress={() => setPage(index)} />
        ))}
      </View>
      <TappablePhoto
        source={ilmaPages[page]}
        alt={`Deck plan page ${page + 1}`}
        gallery={ilmaPages.map((source, index) => ({ source, alt: `Deck plan page ${index + 1}` }))}
        index={page}
        style={styles.image}
        resizeMode="contain"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { marginHorizontal: 12, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8, borderRadius: 18, ...nightGlass },
  pages: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: pad },
  image: { width: "100%", height: 520, marginTop: 12 },
});
