import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  ALERTS_DETAIL,
  ALERTS_LABEL,
  CONTACT_PREFS_KEY,
  NEWS_DETAIL,
  NEWS_LABEL,
  defaultContactPrefs,
  prefsAfterSkip,
  prefsForPrompt,
  readContactPrefs,
  rememberSignInPhone,
  shouldAskContactPrefs,
  shouldOpenContactPrompt,
  stageSignInPhone,
  writeContactPrefs,
  type ContactStore,
} from "./contactPrefs";

function memory(): ContactStore & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("contact preferences", () => {
  it("starts both choices off and keeps a skip that way", () => {
    expect(defaultContactPrefs()).toEqual({ alerts: false, marketing: false, phone: null });
    expect(prefsAfterSkip()).toEqual(defaultContactPrefs());
    expect(`${ALERTS_LABEL} ${ALERTS_DETAIL} ${NEWS_LABEL} ${NEWS_DETAIL}`).not.toMatch(/conversation/i);
    expect(ALERTS_DETAIL).toContain("Session reminders");
  });

  it("asks until this person has saved a choice", () => {
    const store = memory();
    expect(shouldAskContactPrefs(store, "user-1")).toBe(true);
    writeContactPrefs(store, { ...defaultContactPrefs(), userId: "user-1", saved: true });
    expect(readContactPrefs(store)?.saved).toBe(true);
    expect(shouldAskContactPrefs(store, "user-1")).toBe(false);
    expect(shouldAskContactPrefs(store, "user-2")).toBe(true);
    store.setItem("tatel.contactPrefs.prompt", "1");
    expect(shouldAskContactPrefs(store, null)).toBe(true);
    expect(store.values.get(CONTACT_PREFS_KEY)).toContain("\"alerts\":false");
  });

  it("keeps the phone from sign-in and still asks for notification choices", () => {
    const store = memory();
    stageSignInPhone(store, "+13405550100");
    const record = rememberSignInPhone(store, "user-1", "+13405550100");
    expect(record.saved).toBe(false);
    expect(shouldOpenContactPrompt({
      userId: "user-1",
      local: readContactPrefs(store),
      remote: { alerts: false, marketing: false, phone: "+13405550100" },
      stagedPhone: "+13405550100",
      forced: false,
    })).toBe(true);
    expect(prefsForPrompt(readContactPrefs(store), null, "+13405550100", "user-1").phone).toBe("+13405550100");
    writeContactPrefs(store, { ...record, saved: true });
    expect(shouldOpenContactPrompt({
      userId: "user-1",
      local: readContactPrefs(store),
      remote: { alerts: false, marketing: false, phone: "+13405550100" },
      stagedPhone: null,
      forced: false,
    })).toBe(false);
    expect(shouldOpenContactPrompt({
      userId: "user-2",
      local: null,
      remote: { alerts: false, marketing: false, phone: "+13405550100" },
      stagedPhone: null,
      forced: false,
    })).toBe(false);
  });

  it("matches the contact_prefs migration", () => {
    const sql = readFileSync("supabase/migrations/20261113_contact_prefs.sql", "utf8");
    expect(sql).toContain("phone text");
    expect(sql).toContain("alerts_opt_in boolean not null default false");
    expect(sql).toContain("marketing_opt_in boolean not null default false");
    expect(sql).toContain("grant select, insert, update on public.contact_prefs to authenticated");
    expect(sql).toContain("public.has_role(auth.uid(), 'admin')");
  });
});
