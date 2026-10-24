import Svg, { Circle, Path, Rect } from "react-native-svg";
import { colors } from "@/theme";

export type IconName =
  | "home"
  | "calendar"
  | "mic"
  | "people"
  | "menu"
  | "search"
  | "heart"
  | "heartFill"
  | "back"
  | "bell"
  | "pin"
  | "ticket"
  | "chevron"
  | "send"
  | "seat";

type Props = { name: IconName; size?: number; color?: string };

export function Icon({ name, size = 22, color = colors.ink }: Props) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "home" ? <Path {...stroke} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1Z" /> : null}
      {name === "calendar" ? (
        <>
          <Rect {...stroke} x={4} y={5} width={16} height={15} rx={2} />
          <Path {...stroke} d="M4 10h16M8 3v4M16 3v4" />
        </>
      ) : null}
      {name === "mic" ? (
        <>
          <Rect {...stroke} x={9} y={3} width={6} height={10} rx={3} />
          <Path {...stroke} d="M7 11a5 5 0 0 0 10 0M12 16v4M8 20h8" />
        </>
      ) : null}
      {name === "people" ? (
        <>
          <Circle {...stroke} cx={9} cy={8} r={3} />
          <Circle {...stroke} cx={17} cy={9} r={2.3} />
          <Path {...stroke} d="M3.6 19c.6-3 2.8-4.5 5.4-4.5s4.8 1.5 5.4 4.5M15.2 14.7c1.5-.3 2.8.3 3.9 2" />
        </>
      ) : null}
      {name === "menu" ? <Path {...stroke} d="M4 7h16M4 12h16M4 17h10" /> : null}
      {name === "search" ? (
        <>
          <Circle {...stroke} cx={11} cy={11} r={6} />
          <Path {...stroke} d="m16 16 4 4" />
        </>
      ) : null}
      {name === "heart" ? <Path {...stroke} d="M12 19s-7-4.4-7-8.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 14.6 12 19 12 19Z" /> : null}
      {name === "heartFill" ? (
        <Path d="M12 19s-7-4.4-7-8.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 14.6 12 19 12 19Z" fill={color} />
      ) : null}
      {name === "back" ? <Path {...stroke} d="M14.5 5 7.5 12l7 7" /> : null}
      {name === "bell" ? <Path {...stroke} d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16ZM10 19a2 2 0 0 0 4 0" /> : null}
      {name === "pin" ? (
        <>
          <Path {...stroke} d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
          <Circle {...stroke} cx={12} cy={10} r={2.2} />
        </>
      ) : null}
      {name === "ticket" ? (
        <Path {...stroke} d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.2a2 2 0 0 0 0 3.6V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.2a2 2 0 0 0 0-3.6Z" />
      ) : null}
      {name === "chevron" ? <Path {...stroke} d="m9 5 7 7-7 7" /> : null}
      {name === "send" ? <Path {...stroke} d="m4 12 16-8-6 16-2.4-6.2L4 12Z" /> : null}
      {name === "seat" ? <Path {...stroke} d="M7 11V7.5A2.5 2.5 0 0 1 9.5 5h5A2.5 2.5 0 0 1 17 7.5V11M6 11h12v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4ZM8 17v2.5M16 17v2.5" /> : null}
    </Svg>
  );
}
