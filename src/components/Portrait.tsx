import { useState } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { colors } from "@/theme";
import { Monogram } from "./Monogram";
import { TappablePhoto } from "./TappablePhoto";

export function Portrait({
  name,
  source,
  size = 64,
}: {
  name: string;
  source?: ImageSourcePropType;
  size?: number;
}) {
  const radius = size / 2;
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: radius }]}>
      {source && !failed ? (
        <TappablePhoto source={source} alt={name} focus="center 18%" onError={() => setFailed(true)} style={{ width: size, height: size, borderRadius: radius }} resizeMode="cover" />
      ) : (
        <Monogram name={name} size={size} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,224,138,0.7)",
    backgroundColor: "rgba(7,27,42,0.72)",
    ...({
      backgroundImage: "radial-gradient(circle at 50% 35%, rgba(36,64,88,0.95), rgba(7,27,42,0.92))",
    } as ViewStyle),
  },
});
