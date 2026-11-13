import { useEffect, useState } from "react";
import { useAuth } from "@/community/auth";
import {
  clearContactPrompt,
  defaultContactPrefs,
  prefsAfterSkip,
  readContactPrefs,
  shouldAskContactPrefs,
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
    if (shouldAskContactPrefs(store, null) && store?.getItem("tatel.contactPrefs.prompt") === "1") {
      setInitial(readContactPrefs(store) ?? defaultContactPrefs());
      setOpen(true);
      return;
    }
    if (!userId || preview) return;
    let live = true;
    loadContactPrefsRemote(userId).then((remote) => {
      if (!live) return;
      if (remote) {
        writeContactPrefs(store, { ...remote, userId, saved: true });
        clearContactPrompt(store);
        setOpen(false);
        return;
      }
      if (!shouldAskContactPrefs(store, userId)) return;
      setInitial(defaultContactPrefs());
      setOpen(true);
    });
    return () => {
      live = false;
    };
  }, [ready, userId, preview]);

  function persist(prefs: ContactPrefs) {
    const store = webStorage();
    writeContactPrefs(store, { ...prefs, userId: userId ?? null, saved: true });
    clearContactPrompt(store);
    setOpen(false);
    if (userId && !preview) void saveContactPrefsRemote(userId, prefs);
  }

  if (!open) return null;
  return (
    <ContactPrefsCard
      initial={initial}
      onSave={persist}
      onSkip={() => persist(prefsAfterSkip())}
    />
  );
}
