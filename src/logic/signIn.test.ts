import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEFAULT_COUNTRY_ID, countryById, toE164 } from "./phone";
import {
  SMS_ENABLED,
  SMS_UNAVAILABLE_MESSAGE,
  channelsOffered,
  emailOtpRequest,
  emailVerifyRequest,
  isSixDigitCode,
  isSmsUnavailable,
  phoneOtpRequest,
  phoneUpdateAfterEmail,
  phoneVerifyRequest,
  signInFields,
  startEmailSignIn,
  startPhoneSignIn,
} from "./signIn";
import { rememberSignInPhone, type ContactStore } from "./contactPrefs";

function memory(): ContactStore {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("sign-in phone and code", () => {
  it("defaults the country to +1 and builds E.164", () => {
    expect(countryById(DEFAULT_COUNTRY_ID).dial).toBe("1");
    expect(toE164(countryById("us"), "(340) 555-0100")).toBe("+13405550100");
    expect(toE164(countryById("us"), "+1 340 555 0100")).toBe("+13405550100");
    expect(toE164(countryById("us"), "555-0100")).toBeNull();
    expect(toE164(countryById("gb"), "7911123456")).toBe("+447911123456");
  });

  it("requires email and phone, and a 6-digit code", () => {
    expect(signInFields("not-an-email", "us", "3405550100")).toEqual({ error: "Enter a valid email." });
    expect(signInFields("ada@example.com", "us", "555")).toEqual({ error: "Enter a phone number for the selected country." });
    expect(signInFields(" Ada@Example.com ", "us", "3405550100")).toEqual({ email: "ada@example.com", phone: "+13405550100" });
    expect(isSixDigitCode("123456")).toBe(true);
    expect(isSixDigitCode("12345")).toBe(false);
    expect(isSixDigitCode("1234567")).toBe(false);
  });

  it("hides text codes until SMS_ENABLED is turned on", () => {
    expect(SMS_ENABLED).toBe(false);
    expect(channelsOffered(false)).toEqual(["email"]);
    expect(channelsOffered(true)).toEqual(["sms", "email"]);
    expect(readFileSync("src/logic/signIn.ts", "utf8")).toContain('process.env.EXPO_PUBLIC_SMS_ENABLED === "1"');
  });

  it("keeps quick sign-in ahead of the email code", async () => {
    const calls: string[] = [];
    const session = await startEmailSignIn(
      {
        quickSignIn: async () => {
          calls.push("quick");
          return "session";
        },
        sendEmailCode: async () => {
          calls.push("email");
        },
      },
      "sansara13@gmail.com",
    );
    expect(session).toBe("session");
    expect(calls).toEqual(["quick"]);

    const code = await startEmailSignIn(
      {
        quickSignIn: async () => "code",
        sendEmailCode: async (email) => {
          calls.push(email);
        },
      },
      "ada@example.com",
    );
    expect(code).toBe("code");
    expect(calls).toContain("ada@example.com");
  });

  it("offers email when the SMS provider is missing", async () => {
    expect(isSmsUnavailable(new Error("Unsupported phone provider"))).toBe(true);
    expect(isSmsUnavailable(new Error("SMS not configured"))).toBe(true);
    expect(isSmsUnavailable(new Error("Invalid login"))).toBe(false);
    const missing = await startPhoneSignIn(
      {
        sendPhoneCode: async () => {
          throw new Error("Unsupported phone provider");
        },
      },
      "+13405550100",
    );
    expect(missing).toBe("sms-unavailable");
    expect(SMS_UNAVAILABLE_MESSAGE).toMatch(/email you a code/i);
    await expect(startPhoneSignIn({ sendPhoneCode: async () => { throw new Error("Invalid phone"); } }, "+13405550100")).rejects.toThrow("Invalid phone");
  });

  it("uses email and sms otp payloads and stores the phone without updateUser", () => {
    expect(emailOtpRequest(" Ada@Example.com ")).toEqual({ email: "ada@example.com" });
    expect(emailVerifyRequest("ada@example.com", " 123456 ")).toEqual({ email: "ada@example.com", token: "123456", type: "email" });
    expect(phoneOtpRequest("+13405550100")).toEqual({ phone: "+13405550100" });
    expect(phoneVerifyRequest("+13405550100", "123456")).toEqual({ phone: "+13405550100", token: "123456", type: "sms" });
    expect(phoneUpdateAfterEmail()).toBe("contact_prefs");
    const auth = readFileSync("src/community/auth.tsx", "utf8");
    const screen = readFileSync("src/app/community-sign-in.tsx", "utf8");
    expect(auth).not.toContain("updateUser");
    expect(screen).not.toContain("updateUser");
    expect(auth).toContain("signInWithOtp(emailOtpRequest(email))");
    expect(auth).toContain("verifyOtp(emailVerifyRequest(email, code))");
    expect(auth).toContain("signInWithOtp(phoneOtpRequest(phone))");
    expect(auth).toContain("verifyOtp(phoneVerifyRequest(phone, code))");
    const store = memory();
    const first = rememberSignInPhone(store, "user-1", "+13405550100");
    expect(first).toMatchObject({ phone: "+13405550100", alerts: false, marketing: false, saved: false });
    rememberSignInPhone(store, "user-1", "+13405550100");
    const chosen = rememberSignInPhone(store, "user-1", "+13405550199");
    expect(chosen.saved).toBe(false);
    const saved = { ...first, saved: true, alerts: true };
    store.setItem("tatel.contactPrefs.v1", JSON.stringify(saved));
    expect(rememberSignInPhone(store, "user-1", "+13405550100").saved).toBe(true);
    expect(rememberSignInPhone(store, "user-1", "+13405550100").alerts).toBe(true);
  });
});
