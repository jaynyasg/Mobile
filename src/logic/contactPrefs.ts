export const CONTACT_PREFS_KEY = "tatel.contactPrefs.v1";
export const CONTACT_PROMPT_KEY = "tatel.contactPrefs.prompt";
export const STAGED_PHONE_KEY = "tatel.signIn.phone";

export const ALERTS_LABEL = "Send me event alerts";
export const ALERTS_DETAIL = "Session reminders, schedule changes, and boat departures.";
export const NEWS_LABEL = "Send me TATEL news and updates";
export const NEWS_DETAIL = "TATEL communication.";

export interface ContactPrefs {
  alerts: boolean;
  marketing: boolean;
  phone: string | null;
}

export interface StoredContactPrefs extends ContactPrefs {
  userId: string | null;
  saved: boolean;
}

export interface ContactStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export function defaultContactPrefs(): ContactPrefs {
  return { alerts: false, marketing: false, phone: null };
}

export function prefsAfterSkip(): ContactPrefs {
  return defaultContactPrefs();
}

export function readContactPrefs(store: ContactStore | null): StoredContactPrefs | null {
  const raw = store?.getItem(CONTACT_PREFS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredContactPrefs>;
    if (!parsed || typeof parsed.alerts !== "boolean" || typeof parsed.marketing !== "boolean") return null;
    return {
      alerts: parsed.alerts,
      marketing: parsed.marketing,
      phone: typeof parsed.phone === "string" && parsed.phone.trim() ? parsed.phone : null,
      userId: typeof parsed.userId === "string" ? parsed.userId : null,
      saved: parsed.saved === true,
    };
  } catch {
    return null;
  }
}

export function writeContactPrefs(store: ContactStore | null, record: StoredContactPrefs): void {
  store?.setItem(CONTACT_PREFS_KEY, JSON.stringify({
    alerts: record.alerts,
    marketing: record.marketing,
    phone: record.phone,
    userId: record.userId,
    saved: record.saved,
  }));
}

export function shouldAskContactPrefs(store: ContactStore | null, userId: string | null): boolean {
  if (store?.getItem(CONTACT_PROMPT_KEY) === "1") return true;
  if (!userId) return false;
  const saved = readContactPrefs(store);
  return !(saved?.saved && saved.userId === userId);
}

export function clearContactPrompt(store: ContactStore | null): void {
  store?.setItem(CONTACT_PROMPT_KEY, "");
}

export function stageSignInPhone(store: ContactStore | null, phone: string): void {
  store?.setItem(STAGED_PHONE_KEY, phone);
}

export function readStagedPhone(store: ContactStore | null): string | null {
  const value = store?.getItem(STAGED_PHONE_KEY)?.trim();
  return value ? value : null;
}

export function clearStagedPhone(store: ContactStore | null): void {
  store?.setItem(STAGED_PHONE_KEY, "");
}

/** Keep an existing notification choice. A first sign-in stores the phone and still asks. */
export function rememberSignInPhone(store: ContactStore | null, userId: string, phone: string): StoredContactPrefs {
  const existing = readContactPrefs(store);
  const same = existing?.userId === userId;
  const record: StoredContactPrefs = {
    alerts: same ? existing.alerts : false,
    marketing: same ? existing.marketing : false,
    phone,
    userId,
    saved: same ? existing.saved : false,
  };
  writeContactPrefs(store, record);
  if (record.saved) clearStagedPhone(store);
  return record;
}

export function prefsForPrompt(
  local: StoredContactPrefs | null,
  remote: ContactPrefs | null,
  stagedPhone: string | null,
  userId: string | null,
): ContactPrefs {
  const mine = local?.userId && local.userId === userId ? local : null;
  return {
    alerts: mine?.alerts ?? remote?.alerts ?? false,
    marketing: mine?.marketing ?? remote?.marketing ?? false,
    phone: stagedPhone ?? mine?.phone ?? remote?.phone ?? null,
  };
}

export function shouldOpenContactPrompt(input: {
  userId: string | null;
  local: StoredContactPrefs | null;
  remote: ContactPrefs | null;
  stagedPhone: string | null;
  forced: boolean;
}): boolean {
  if (input.forced) return true;
  if (!input.userId) return false;
  if (input.local?.saved && input.local.userId === input.userId) return false;
  if (input.stagedPhone) return true;
  if (input.local?.userId === input.userId && input.local.saved === false) return true;
  if (input.remote) return false;
  return true;
}
