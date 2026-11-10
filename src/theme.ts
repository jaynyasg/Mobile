export const colors = {
  paper: "#F4F7F8",
  paperRaised: "rgba(255,255,255,0.82)",
  ink: "#0B1B2B",
  inkSoft: "#24384A",
  line: "rgba(11,27,43,0.12)",
  pine: "#0B1B2B",
  pineDeep: "#071421",
  ivory: "#F7F4EF",
  brass: "#7A5E1A",
  brassSoft: "#C9A24A",
  clay: "#0E7490",
  stage: "#071421",
  muted: "#D5DEE3",
  turquoise: "#0E7490",
  gold: "#C9A24A",
  onDark: "#F7F4EF",
  onDarkSoft: "rgba(247,244,239,0.82)",
};

export const fonts = {
  display: "BodoniModa-SemiBold",
  displayMedium: "BodoniModa-Medium",
  body: "Manrope-Regular",
  medium: "Manrope-Medium",
  semibold: "Manrope-SemiBold",
};

export const pad = 16;
export const radius = 22;

export const scenePhotos = {
  day: "/venues/ritz-carlton-st-thomas/img_2650-1280.webp",
  community: "/venues/hideout-white-bay/img_2673-1280.webp",
  byIsland: {
    "St. Thomas": "/venues/ritz-carlton-st-thomas/img_2650-1280.webp",
    "St. John": "/venues/emerald-beach-resort/img_1438-1280.webp",
    "Scrub Island": "/venues/scrub-island-resort/img_2705-1280.webp",
    "Jost Van Dyke": "/venues/hideout-white-bay/img_2673-1280.webp",
    Lovango: "/venues/lovango-resort-beach-club/img_2668-1280.webp",
  } as Record<string, string>,
};

export function sceneForIsland(island?: string | null): string {
  if (island && scenePhotos.byIsland[island]) return scenePhotos.byIsland[island];
  return scenePhotos.day;
}
