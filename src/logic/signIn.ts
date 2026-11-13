import { countryById, toE164 } from "./phone";

/**
 * Text codes stay off until Firebase Phone Auth is configured.
 * Set EXPO_PUBLIC_SMS_ENABLED=1 and rebuild to show "Text me a code".
 */
export const SMS_ENABLED = process.env.EXPO_PUBLIC_SMS_ENABLED === "1";

export const SMS_UNAVAILABLE_MESSAGE = "Text codes are not available right now. We can email you a code instead.";

const TEXT_CODE_ERRORS = new Set([
  "auth/invalid-verification-code",
  "auth/missing-verification-code",
  "auth/code-expired",
  "auth/invalid-verification-id",
]);

export class PhoneSignInError extends Error {
  readonly fallback: boolean;

  constructor(message: string, fallback: boolean) {
    super(message);
    this.name = "PhoneSignInError";
    this.fallback = fallback;
  }
}

export function shouldFallBackFromText(error: unknown): boolean {
  if (error instanceof PhoneSignInError) return error.fallback;
  if (error instanceof Error && error.name === "PhoneSignInError" && "fallback" in error) {
    return (error as PhoneSignInError).fallback;
  }
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "";
  if (TEXT_CODE_ERRORS.has(code)) return false;
  return true;
}

export type SignInChannel = "email" | "sms";

export function channelsOffered(smsEnabled: boolean): SignInChannel[] {
  return smsEnabled ? ["sms", "email"] : ["email"];
}

export function signInFields(email: string, countryId: string, national: string): { email: string; phone: string } | { error: string } {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { error: "Enter a valid email." };
  const phone = toE164(countryById(countryId), national);
  if (!phone) return { error: "Enter a phone number for the selected country." };
  return { email: trimmed, phone };
}

export function isSixDigitCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

export function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "";
}

export function emailOtpRequest(email: string): { email: string } {
  return { email: email.trim().toLowerCase() };
}

export function emailVerifyRequest(email: string, token: string): { email: string; token: string; type: "email" } {
  return { email: email.trim().toLowerCase(), token: token.trim(), type: "email" };
}

/**
 * updateUser({ phone }) starts a phone-change SMS and does not store the number until that second code is verified.
 * With no SMS provider it fails. Email sign-in stores the number only in contact_prefs.
 */
export function phoneUpdateAfterEmail(): "contact_prefs" {
  return "contact_prefs";
}

export async function startEmailSignIn(
  deps: {
    quickSignIn: (email: string) => Promise<"session" | "code">;
    sendEmailCode: (email: string) => Promise<void>;
  },
  email: string,
): Promise<"session" | "code"> {
  const quick = await deps.quickSignIn(email);
  if (quick === "session") return "session";
  await deps.sendEmailCode(email);
  return "code";
}

export async function startPhoneSignIn(
  deps: { sendPhoneCode: (phone: string) => Promise<void> },
  phone: string,
): Promise<"code" | "sms-unavailable"> {
  try {
    await deps.sendPhoneCode(phone);
    return "code";
  } catch {
    return "sms-unavailable";
  }
}
