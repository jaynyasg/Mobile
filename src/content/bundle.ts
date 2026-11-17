import raw from "./tatel.json";
import places from "./places.json";
import type { Place, ProgramData } from "./types";
import { applyExperienceContent } from "./experience";

export const bundle = applyExperienceContent({ ...(raw as object), places: places as Place[] } as unknown as ProgramData);
