import { useEffect, useState } from "react";
import { useAuth } from "@/community/auth";
import {
  clearContactPrompt,
  clearStagedPhone,
  defaultContactPrefs,
  prefsForPrompt,
  readContactPrefs,
  readStagedPhone,
  shouldOpenContactPrompt,
  writeContactPrefs,
  type ContactPrefs,
} from "@/logic/contactPrefs";
import { loadContactPrefsRemote, saveContactPrefsRemote } from "@/logic/contactPrefsSync";
import { webStorage } from "@/welcome";
import { ContactPrefsCard } from "./ContactPrefsCard";

export function ContactPrompt() {
  const { userId, preview, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<ContactPrefs>(defaultContactPrefs());

  useEffect(() => {
    if (!ready) return;
    const store = webStorage();
    const forced = store?.getItem("tatel.contactPrefs.prompt") === "1";
    if (forced) {
      setInitial(prefsForPrompt(readContactPrefs(store), null, readStagedPhone(store), userId));
      setOpen(true);
      return;
    }
    if (!userId || preview) return;
    let live = true;
    loadContactPrefsRemote(userId).then((remote) => {
      if (!live) return;
      const local = readContactPrefs(store);
      const stagedPhone = readStagedPhone(store);
      if (!shouldOpenContactPrompt({ userId, local, remote, stagedPhone, forced: false })) {
        if (remote) {
          writeContactPrefs(store, {
            alerts: remote.alerts,
            marketing: remote.marketing,
            phone: local?.phone ?? remote.phone,
            userId,
            saved: true,
          });
        }
        clearContactPrompt(store);
        setOpen(false);
        return;
      }
      setInitial(prefsForPrompt(local, remote, stagedPhone, userId));
      setOpen(true);
    });
    return () => {
      live = false;
    };
  }, [ready, userId, preview]);

  function persist(prefs: ContactPrefs) {
    const store = webStorage();
    const phone = prefs.phone ?? readStagedPhone(store);
    const record = { ...prefs, phone, userId: userId ?? null, saved: true };
    writeContactPrefs(store, record);
    clearStagedPhone(store);
    clearContactPrompt(store);
    setOpen(false);
    if (userId && !preview) void saveContactPrefsRemote(userId, record);
  }

  if (!open) return null;
  return (
    <ContactPrefsCard
      initial={initial}
      onSave={persist}
      onSkip={() => persist({ alerts: false, marketing: false, phone: initial.phone })}
    />
  );
}
