import raw from "./tatel.json";
import places from "./places.json";
import type { Place, ProgramData } from "./types";

export const bundle = { ...(raw as object), places: places as Place[] } as unknown as ProgramData;
