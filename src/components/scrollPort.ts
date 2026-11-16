import { ViewStyle } from "react-native";

/**
 * A flex child that is allowed to shrink. Without this, web lays the scroller
 * out at its content height and the page clips whatever falls past the screen.
 */
export const scrollPort: ViewStyle = { flex: 1, minHeight: 0 };
