import { passTier, type PassTier } from "./passPay";

/** Which pass this device shows. Separate from the intake answer, so a retake can still change "I have it". */
export const OWNED_PASS_KEY = "tatel.ownedPass.v1";

export interface OwnedPassStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export function readOwnedPass(store: OwnedPassStore | null): PassTier | null {
  return passTier(store?.getItem(OWNED_PASS_KEY));
}

export function writeOwnedPass(store: OwnedPassStore | null, tier: PassTier): void {
  store?.setItem(OWNED_PASS_KEY, tier);
}
