import { ViewStyle } from "react-native";

/** A text column beside an icon. The outer wrapper, not this column, gets the zero basis. */
export const clip: ViewStyle = { flexGrow: 1, flexShrink: 1, minWidth: 0, maxWidth: "100%" };
