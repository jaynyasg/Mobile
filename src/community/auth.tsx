import { Session } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { communityPreviewEnabled, supabase } from "./client";
import { previewActor } from "./memory";

interface AuthValue {
  ready: boolean;
  userId: string | null;
  email: string | null;
  staff: boolean;
  preview: boolean;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const preview = communityPreviewEnabled();
  const [ready, setReady] = useState(preview);
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState(preview);

  useEffect(() => {
    if (preview) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [preview]);

  useEffect(() => {
    if (preview || !session?.user.id) return;
    supabase.rpc("community_is_staff", { uid: session.user.id }).then(({ data }) => {
      setStaff(data === true);
    });
  }, [preview, session?.user.id]);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      userId: preview ? previewActor().profile.id : session?.user.id ?? null,
      email: preview ? "preview@tatel.invalid" : session?.user.email ?? null,
      staff,
      preview,
      sendCode: async (email) => {
        const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
        if (error) throw error;
      },
      verifyCode: async (email, code) => {
        const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
        if (error) throw error;
      },
      signOut: async () => {
        if (preview) return;
        await supabase.auth.signOut();
      },
    }),
    [preview, ready, session, staff],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
