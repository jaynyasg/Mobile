/** One-tap device reset. Any URL with ?fresh wipes this origin, then opens /. */

export function wantsFresh(search: string): boolean {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(query).has("fresh");
}

export function wipeWebStorage(
  local: { clear?: () => void } | null,
  session: { clear?: () => void } | null,
): void {
  try {
    local?.clear?.();
  } catch {
    // Private mode can throw. The redirect still leaves a clean URL.
  }
  try {
    session?.clear?.();
  } catch {
    // Same as local storage.
  }
}

function searchNow(): string | null {
  if (typeof window === "undefined" || window.location == null) return null;
  return window.location.search ?? "";
}

async function dropCaches(): Promise<void> {
  const cacheStore = window.caches;
  if (!cacheStore) return;
  const keys = await cacheStore.keys();
  await Promise.all(keys.map((key) => cacheStore.delete(key)));
}

async function dropDatabases(): Promise<void> {
  const idb = window.indexedDB;
  if (!idb?.databases) return;
  const rows = await idb.databases();
  await Promise.all(rows.map((row) => deleteDatabase(idb, row.name)));
}

function deleteDatabase(idb: IDBFactory, name: string | undefined): Promise<void> {
  if (!name) return Promise.resolve();
  return new Promise((resolve) => {
    const request = idb.deleteDatabase(name);
    const done = () => resolve();
    request.onsuccess = done;
    request.onerror = done;
    request.onblocked = done;
  });
}

async function dropWorkers(): Promise<void> {
  const workers = navigator.serviceWorker;
  if (!workers?.getRegistrations) return;
  const registrations = await workers.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

async function signOut(): Promise<void> {
  const { supabase } = await import("@/community/client");
  await Promise.race([
    supabase.auth.signOut(),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
}

async function resetDevice(): Promise<void> {
  wipeWebStorage(window.localStorage, window.sessionStorage);
  await Promise.all([
    dropCaches().catch(() => undefined),
    dropDatabases().catch(() => undefined),
    dropWorkers().catch(() => undefined),
    signOut().catch(() => undefined),
  ]);
  wipeWebStorage(window.localStorage, window.sessionStorage);
  window.location.replace("/");
  await new Promise((resolve) => setTimeout(resolve, 4000));
}

export const freshReset: Promise<void> | null = searchNow() != null && wantsFresh(searchNow() ?? "")
  ? resetDevice()
  : null;
