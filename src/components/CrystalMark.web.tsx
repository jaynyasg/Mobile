import { createElement } from "react";
import { StyleSheet, View } from "react-native";

const diamond = "0,-7 1.4,-1.4 7,0 1.4,1.4 0,7 -1.4,1.4 -7,0 -1.4,-1.4";

export function CrystalMark() {
  return (
    <View style={styles.wrap} accessibilityRole="header" accessibilityLabel="TATEL">
      {createElement(
        "svg",
        { viewBox: "0 0 440 108", width: "100%", height: "100%", role: "img", "aria-label": "TATEL" },
        createElement(
          "defs",
          null,
          createElement(
            "linearGradient",
            { id: "tatel-facet", x1: "0", y1: "0", x2: "1", y2: "1" },
            createElement("stop", { offset: "0%", stopColor: "#F7FBFF" }),
            createElement("stop", { offset: "20%", stopColor: "#B9E6FF" }),
            createElement("stop", { offset: "38%", stopColor: "#FFFFFF" }),
            createElement("stop", { offset: "54%", stopColor: "#E6D6FF" }),
            createElement("stop", { offset: "72%", stopColor: "#FFF3CC" }),
            createElement("stop", { offset: "100%", stopColor: "#9ED4EA" }),
          ),
          createElement(
            "filter",
            { id: "tatel-halo", x: "-20%", y: "-40%", width: "140%", height: "180%" },
            createElement("feDropShadow", { dx: "0", dy: "2", stdDeviation: "2.4", floodColor: "#071422", floodOpacity: "0.78" }),
          ),
        ),
        createElement(
          "text",
          {
            x: "220",
            y: "78",
            textAnchor: "middle",
            fill: "url(#tatel-facet)",
            stroke: "rgba(255,255,255,0.9)",
            strokeWidth: "0.7",
            filter: "url(#tatel-halo)",
            style: {
              fontFamily: "BodoniModa-SemiBold, 'Bodoni Moda', serif",
              fontSize: "72px",
              letterSpacing: "12px",
            },
          },
          "TATEL",
        ),
        createElement("polygon", { points: diamond, transform: "translate(28 54)", className: "tatel-twinkle", fill: "#F7FBFF" }),
        createElement("polygon", { points: diamond, transform: "translate(412 54)", className: "tatel-twinkle tatel-twinkle-late", fill: "#D7FFF4" }),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "86%", maxWidth: 420, aspectRatio: 440 / 108 },
});
