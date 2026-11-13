import { Session } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { rememberSignInPhone } from "@/logic/contactPrefs";
import { saveContactPrefsRemote } from "@/logic/contactPrefsSync";
import { PhoneSignInError, emailOtpRequest, emailVerifyRequest } from "@/logic/signIn";
import { webStorage } from "@/welcome";
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
  sendPhoneCode: (phone: string) => Promise<void>;
  verifyPhoneCode: (email: string, code: string) => Promise<void>;
  quickSignIn: (email: string) => Promise<"session" | "code">;
  savePhone: (phone: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);
let pendingPhoneCode: { confirm: (code: string) => Promise<string> } | null = null;

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
        const { error } = await supabase.auth.signInWithOtp(emailOtpRequest(email));
        if (error) throw error;
      },
      verifyCode: async (email, code) => {
        const { error } = await supabase.auth.verifyOtp(emailVerifyRequest(email, code));
        if (error) throw error;
      },
      sendPhoneCode: async (phone) => {
        const { requestPhoneCode } = await import("@/community/firebasePhone");
        pendingPhoneCode = await requestPhoneCode(phone);
      },
      verifyPhoneCode: async (email, code) => {
        if (!pendingPhoneCode) throw new PhoneSignInError("Request a text code first.", true);
        const idToken = await pendingPhoneCode.confirm(code);
        pendingPhoneCode = null;
        const response = await fetch("/api/phone-signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, email: email.trim() }),
        });
        if (response.status === 403) throw new PhoneSignInError("That email is already on a different phone. Use email me a code.", false);
        if (response.status === 429) throw new PhoneSignInError("Slow down for a minute, then try again.", false);
        if (!response.ok) throw new PhoneSignInError("Text codes are not available right now. We can email you a code instead.", true);
        const body = (await response.json()) as { access_token?: string; refresh_token?: string };
        if (!body.access_token || !body.refresh_token) throw new PhoneSignInError("Text codes are not available right now. We can email you a code instead.", true);
        const { error } = await supabase.auth.setSession({ access_token: body.access_token, refresh_token: body.refresh_token });
        if (error) throw error;
      },
      savePhone: async (phone) => {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user.id;
        if (!userId || preview) return;
        const record = rememberSignInPhone(webStorage(), userId, phone);
        await saveContactPrefsRemote(userId, record);
      },
      quickSignIn: async (email) => {
        const response = await fetch("/api/quick-signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        if (response.status === 403) return "code";
        if (response.status === 429) throw new Error("Slow down for a minute, then try again.");
        if (!response.ok) throw new Error("Sign-in is unavailable.");
        const body = (await response.json()) as { access_token?: string; refresh_token?: string };
        if (!body.access_token || !body.refresh_token) throw new Error("Sign-in is unavailable.");
        const { error } = await supabase.auth.setSession({ access_token: body.access_token, refresh_token: body.refresh_token });
        if (error) throw error;
        return "session";
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
