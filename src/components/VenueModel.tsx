import { T } from "./Text";

export function VenueModel({ src, label }: { src: string; label: string }) {
  return <T variant="meta">3D preview opens in the installed web app. {label} {src}</T>;
}
